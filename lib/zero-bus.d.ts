export declare class ZeroBus {
    private config;
    private seneca;
    actPromise: (msgArg: any) => Promise<any>;
    private constructor();
    static instance(config: ZbConfig): Promise<ZeroBus>;
    /**    *
 
     *
     * @param {*} msgUsedAsPattern
     * @param {(msg: any, done: DoneFunc) => any} [cbFunc] Omitting the callback makes a message asynchronous.
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, cbFunc?: (msg: any, done: DoneFunc) => any): void;
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
    debug: {
        ztrans?: boolean;
        repl?: number;
        print?: boolean;
    };
}
