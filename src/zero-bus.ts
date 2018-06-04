const ztrans = require('seneca-zyre-transport')
const Seneca = require('seneca')
const Promise = require('bluebird');
const Patrun = require('patrun');
const Jsonic = require('jsonic');
import { Observable } from 'rxjs';
import { map, flatMap, take, bufferCount } from 'rxjs/operators';
import * as _ from "lodash";
import { clean } from './util';


const debug = true;
export class ZeroBus {

    private constructor(private config: ZbConfig, public seneca: any) {
    }

    /**
     * quick form to be used with plugin node command start
     * 
     * @static
     * @param {{ name: string, terminalId: string, iface: string }} args 
     * @param {{
     *         ztrans?: boolean; //verbose zyre/senca transport logging
     *         repl?: number //repl port zero is free port chosen by OS,
     *         print?: boolean //pretty print seneca logging to console
     *     }} [debug] 
     * @returns {Promise<ZeroBus>} 
     * @memberof ZeroBus
     */
    static default(args: { name: string, terminalId: string, iface: string }, debug?: {
        ztrans?: boolean; //verbose zyre/senca transport logging
        repl?: number //repl port zero is free port chosen by OS,
        print?: boolean //pretty print seneca logging to console
    }): Promise<ZeroBus> {
        let config: ZbConfig = {
            name: args.name,
            headers: {
                terminalId: args.terminalId
            },
            iface: args.iface
        }
        if (debug) {
            config.debug = debug
        }
        return ZeroBus.instance(config);
    }

    /**
     * 
     * 
     * @static
     * @param {ZbConfig} config 
     * @returns {Promise<ZeroBus>} 
     * @memberof ZeroBus
     */
    static instance(config: ZbConfig): Promise<ZeroBus> {
        return new Promise((resolve) => {
            let seneca = Seneca({
                tag: config.name
            })
                .use(ztrans, {
                    zyre: {
                        ...config
                    }
                })
                .client({ type: 'zyre' })
                .listen({ type: 'zyre' })
            if (config.debug) {
                if (config.debug.repl !== undefined) seneca.use('seneca-repl', { port: config.debug.repl })
                if (config.debug.print) seneca.test('print')
            }
            seneca.ready(function () {
                resolve(new ZeroBus(config, this));
            })
        })
    }


    /**
     *  You must always call the done: DoneFunc function, at the end of your cbFunc implementation, 
     *  even when there is no response data, as this lets Seneca know that the action is complete.
     * 
     * @param {*} msgUsedAsPattern jsonic can be used, the order of key/values seems to be important, pattern match seem a little iffy, be sure to test
     * @param {(msg: any, done: DoneFunc) => any} cbFunc where DoneFunc has a declaration of (error: any, responseMsg: any) => void & can add observed$: true as prop to responseMsg for multiple responses
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, cbFunc: (msg: any, done: DoneFunc) => any): void {
        this.seneca.add(msgUsedAsPattern, cbFunc);
    }


    /**
     * perform an action, returns an observable reponse or stream of responses 
     * 
     * @param {*} msgArg 
     * @returns {Observable<any>} the response msg(s) if the msg contains observed$: true stream remains open else it is completed
     * @memberof ZeroBus
     */
    act(msgArg: any, take?: number): Observable<any> {
        return Observable.create((o) => {
            this.seneca.act(
                msgArg,
                function (err, out) {
                    if(debug) console.log(err && err.message || out)
                    if (err) o.error(err)
                    let observed$ = out.observed$;
                    o.next(out);
                    if (!observed$) {
                        o.complete();
                    }
                })
        }).pipe(bufferCount(take || 1))
    }

    /**
     * in situations where actor functions respond with observed$:true
     * we can use findPeersWithPattern(pat) to find out how many responses 
     * to expect and can aggregate the reults and the complete the observable
     * 
     * @param {*} msgArg 
     * @returns {Observable<any[]>} 
     * @memberof ZeroBus
     */
    observeActAggregate(msgArg: any): Observable<any[]> {
        return this.findPeersWithPattern(msgArg)
            .pipe(
                flatMap((matches: string[]) => {
                    let takeNum = matches.length > 0 ? matches.length : 1;
                    return this.act(msgArg, takeNum).pipe(map(r => <any[]>r))
                })
            )
    }

    /**
     * filters getPeerEndpoints result removing ports and duplicates
     * 
     * @returns {Observable<string[]>} 
     * @memberof ZeroBus
     */
    getPeerIps(): Observable<string[]> {
        return this.getPeerEndpoints()
            .pipe(map((ends: string[]) => {
                return _.uniq(ends.map(e => {
                    if (e.indexOf(":") > 1) {
                        return e.split(":")[0]
                    }
                }))
            }))
    }

    /**
     * contains duplicates, since we are likely to have local peer process but there ports are included,
     * we need the dups to get the number of peers so we can take that number from the 
     * 
     * @returns {Observable<string[]>} 
     * @memberof ZeroBus
     */
    getPeerEndpoints(): Observable<string[]> {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerEndpoints' }).pipe(
            map((resp) => {
                let result = resp[0]
                if(debug) console.log("peer endpoints: ", result)//peer endpoints:  [ { peerIps: [ '10.50.113.218' ] } ]
                return result.peerIps;
            }))
    }

    /**
     * get latest patterns collected from all connected peers, these can be process or network peers
     * 
     * @returns {Observable<any>} 
     * @memberof ZeroBus
     */
    getPeerPatterns(): Observable<Dictionary<any[]>> {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerPatterns' }).pipe(
            map((resp) => {
                let result = (_.isArray(resp) && resp.length == 1)? resp[0] : resp;
                if(debug) console.log("peer patterns: ", result)
                return result;
            }))
    }

    /**
     * build a map of patrun instances for each peer containing that patterns
     * collected from all the peers
     * 
     * @returns {Observable<Dictionary<any[]>>} 
     * @memberof ZeroBus
     */
    getPeerPatrunMap(): Observable<Dictionary<any[]>> {
        let peersToPatrunDict = {};
        return this.getPeerPatterns().pipe(map((pps: Dictionary<any[]>) => {
            Object.keys(pps).map((k: string) => {
                let pm = Patrun({ gex: true });
                pps[k].map((p) => pm.add(p, true));//build patrun instance for peer
                peersToPatrunDict[k] = pm;
            })
            return peersToPatrunDict;
        }))
    }

    /**
     * returns a list of zyre peer ids for thoes peer instance that have a match for the pattern
     * this is useful in cases such as where actor functions respond with observed$: true
     * we then know how many messages should be in the stream cause we know how many peers
     * have that pattern
     * 
     * FIXME: buggy pattern is not getting matched
     * 
     * @param {*} pattern 
     * @returns {Observable<string[]>} 
     * @memberof ZeroBus
     */
    findPeersWithPattern(pattern: any): Observable<string[]> {
        //treat pat the same os seneca internals do
        var pat = _.isString(pattern) ? Jsonic(pattern) : pattern
        pat = clean(pat)
        pat = pat || {}
        //list peer ids that have a match
        let peersWithMatch: string[] = [];
        return this.getPeerPatrunMap().pipe(
            map((peersToPatrunDict: any) => {
                Object.keys(peersToPatrunDict).map((k: string) => {
                    let peerPatrun = peersToPatrunDict[k]
                    if(debug){
                        console.log("pat run instance: ", peerPatrun)
                        console.log("pat run list: ", peerPatrun.list())
                        console.log("pat to find: ", pat)
                    }
                    if (peerPatrun.find(pat, { exact: false }) !== null) {
                        peersWithMatch.push(k);
                    }
                })
                return peersWithMatch;
            })
        )
    }


}

export declare type DoneFunc = (error: any, responseMsg: any) => void;
export declare abstract class Dictionary<T> {
    [id: string]: T;
}

/**
 * passed into seneca-zyre-transport where deafults are set for optional fields
 * 
 * @export
 * @interface ZbConfig
 */
export interface ZbConfig {
    name: string;      // Name of the zyre node - required in constructor zyreConfig
    iface: string;    // Network interface
    headers: {        // Headers will be sent on every new connection
        terminalId: string //required in constructor zyreConfig
    };
    evasive?: number;    // Timeout after which the local node will try to ping a not responding peer
    expired?: number; //maximum positive value for a 32-bit signed binary integer  // Timeout after which a not responding peer gets disconnected
    port?: number;      // Port for incoming messages; will be incremented if already in use
    bport?: number;      // Discovery beacon broadcast port
    binterval?: number; // Discovery beacon broadcast interval
    debug?: {
        ztrans?: boolean; //verbose zyre/senca transport logging
        repl?: number //repl port zero is free port chosen by OS,
        print?: boolean //pretty print seneca logging to console
    }

}
