export declare class ZeroBus {
    private config;
    seneca: any;
    actPromise: (msgArg: any) => Promise<any>;
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
     * @param {(msg: any, done: DoneFunc) => any} cbFunc
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, cbFunc: (msg: any, done: DoneFunc) => any): void;
    /**
     * perform an action
     *
     * @param {*} msgArg
     * @returns {Promise<any>}
     * @memberof ZeroBus
     */
    act(msgArg: any): Promise<any>;
    getPeerIps(): Promise<string[]>;
}
export declare type DoneFunc = (error: any, responseMsg: any) => void;
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
