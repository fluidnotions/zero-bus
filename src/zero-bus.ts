const ztrans = require('seneca-zyre-transport')
const Seneca = require('seneca')
const Promise = require('bluebird');
import { Observable } from 'rxjs';
import { map, flatMap, take } from 'rxjs/operators';
import * as _ from "lodash";

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
                //add getPeerPatterns to self so we can get patterns from all peers --it can't be def in transport, 
                //case then when we call act the local will get hit. But we can create a seperate one call client
                this.add({ role: 'p2p', type: 'zyre', cmd: 'getPeerPatterns', }, get_peer_patterns);
                function get_peer_patterns(msg, done) {
                    let seneca = this
                    //remove role:transport and role:seneca
                    let patterns = seneca.list()//.filter(p => !p.role || (p.role !== 'transport' && p.role !== 'seneca'))
                    let id = seneca.id;
                    console.log("get_peer_patterns: self Id: ", id, " patterns(no filtered): ", patterns)
                    done(null, {
                        id: id,
                        patterns: patterns,
                        observed$: true
                    })
                }
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
    act(msgArg: any): Observable<any> {
        return Observable.create((o) => {
            this.seneca.act(
                msgArg,
                function (err, out) {
                    console.log(err && err.message || out)
                    if (err) o.error(err)
                    let observed$ = out.observed$;
                    o.next(out);
                    if (!observed$) {
                        o.complete();
                    }
                })
        })
    }

    /**
     * contains duplicates, since we are likely to have local peer process but there ports are included,
     * we need the dups to get the number of peers so we can take that number from the 
     * 
     * @returns {Observable<string[]>} 
     * @memberof ZeroBus
     */
    getPeerEndpoints(): Observable<string[]> {
        //this ends up being called locally cause it;s defined in the transport plugin we are using
        //if you call act and the pattern exists locally it won't be broadcast to other peers
        //FIXME: would be better if we could isolate this code and extert some controll
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerEndpoints' }).pipe(
            map((result) => {
                console.log("result: ", result)
                return result.peerIps;
            }))
    }

    /**
     * 
     * 
     * @param {ZbConfig} config 
     * @param {number} takePeers will complete the observable after we have the responses we want
     * @returns {Observable<any>} 
     * @memberof ZeroBus
     */
    getPeerPatterns(takePeers: number): Observable<any> {
        let conf = this.config;
        //create standalone seneca client instance which unlike our main doesn't have role:p2p, thereby insuring the request will be broadcast
        return Observable.create(o => {
            Seneca()
                .use(ztrans, {
                    zyre: {
                        ...conf,
                        terminalId: undefined,
                        name: "ONCE_OFF_GET_PATTERNS_CLIENT",
                        debug: { ztrans: true, repl: 0, print: true }
                    }
                })
                .client({ type: 'zyre' })
                .ready(function () {
                    this.act(
                        { role: 'p2p', type: 'zyre', cmd: 'getPeerPatterns' },
                        function (err, out) {
                            console.log("getPeerPatterns: res: ", err && err.message || out)
                            if (err) o.error(err)
                            o.next(out)
                            // this.close()
                        })
                })
        })
        //.pipe(take(takePeers))

    }


}

export declare type DoneFunc = (error: any, responseMsg: any) => void;

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
