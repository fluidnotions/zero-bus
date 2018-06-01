import { Observable } from 'rxjs';
export declare class ZeroBus {
    private config;
    seneca: any;
    private constructor();
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
    static default(args: {
        name: string;
        terminalId: string;
        iface: string;
    }, debug?: {
        ztrans?: boolean;
        repl?: number;
        print?: boolean;
    }): Promise<ZeroBus>;
    /**
     *
     *
     * @static
     * @param {ZbConfig} config
     * @returns {Promise<ZeroBus>}
     * @memberof ZeroBus
     */
    static instance(config: ZbConfig): Promise<ZeroBus>;
    /**
     *  You must always call the done: DoneFunc function, at the end of your cbFunc implementation,
     *  even when there is no response data, as this lets Seneca know that the action is complete.
     *
     * @param {*} msgUsedAsPattern jsonic can be used, the order of key/values seems to be important, pattern match seem a little iffy, be sure to test
     * @param {(msg: any, done: DoneFunc) => any} cbFunc where DoneFunc has a declaration of (error: any, responseMsg: any) => void & can add observed$: true as prop to responseMsg for multiple responses
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, cbFunc: (msg: any, done: DoneFunc) => any): void;
    /**
     * perform an action, returns an observable reponse or stream of responses
     *
     * @param {*} msgArg
     * @returns {Observable<any>} the response msg(s) if the msg contains observed$: true stream remains open else it is completed
     * @memberof ZeroBus
     */
    act(msgArg: any, take?: number): Observable<any>;
    /**
     * in situations where actor functions respond with observed$:true
     * we can use findPeersWithPattern(pat) to find out how many responses
     * to expect and can aggregate the reults and the complete the observable
     *
     * @param {*} msgArg
     * @returns {Observable<any[]>}
     * @memberof ZeroBus
     */
    observeActAggregate(msgArg: any): Observable<any[]>;
    /**
     * filters getPeerEndpoints result removing ports and duplicates
     *
     * @returns {Observable<string[]>}
     * @memberof ZeroBus
     */
    getPeerIps(): Observable<string[]>;
    /**
     * contains duplicates, since we are likely to have local peer process but there ports are included,
     * we need the dups to get the number of peers so we can take that number from the
     *
     * @returns {Observable<string[]>}
     * @memberof ZeroBus
     */
    getPeerEndpoints(): Observable<string[]>;
    /**
     * get latest patterns collected from all connected peers, these can be process or network peers
     *
     * @returns {Observable<any>}
     * @memberof ZeroBus
     */
    getPeerPatterns(): Observable<Dictionary<any[]>>;
    /**
     * build a map of patrun instances for each peer containing that patterns
     * collected from all the peers
     *
     * @returns {Observable<Dictionary<any[]>>}
     * @memberof ZeroBus
     */
    getPeerPatrunMap(): Observable<Dictionary<any[]>>;
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
    findPeersWithPattern(pattern: any): Observable<string[]>;
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
    name: string;
    iface: string;
    headers: {
        terminalId: string;
    };
    evasive?: number;
    expired?: number;
    port?: number;
    bport?: number;
    binterval?: number;
    debug?: {
        ztrans?: boolean;
        repl?: number;
        print?: boolean;
    };
}
