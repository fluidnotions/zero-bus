const ztrans = require('seneca-zyre-transport')
const Seneca = require('seneca')
const Promise = require('bluebird');

export class ZeroBus {

    actPromise: (msgArg: any) => Promise<any>;
    private constructor(private config: ZbConfig, private seneca: any) {
        this.actPromise = Promise.promisify(this.seneca.act, { context: this.seneca });
    }

    static instance(config: ZbConfig): Promise<ZeroBus> {
        return new Promise((resolve) => {
            let seneca = Seneca({
                tag: config.name
            })
                .test('print')
                .use('seneca-repl', { port: 0 })
                .use(ztrans, {
                    zyre: {
                        ...config
                    }
                })
                .client({ type: 'zyre' })
                .listen({ type: 'zyre' })
            if (config.repl) {
                seneca.use('seneca-repl', { port: config.repl })
            }
            seneca.ready(function () {
                resolve(new ZeroBus(config, this));
            })
        })
    }

    add(msgUsedAsPattern: any, func: (msg: any, done: DoneFunc) => any): void {
        this.seneca.add(msgUsedAsPattern, func);
    }

    act(msgArg: any): Promise<any> {
        return this.actPromise(msgArg).catch((err) => console.error("act failed: ", err))
    }

    getPeerIps(): Promise<string[]> {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerIps', })
            .then((result) => {
                return result.peerIps;
            }).catch(function (err) {
                // err will be set with a timeout error thrown by the gate executer
                console.error(err)
            });
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
    binterval?: number;  // Discovery beacon broadcast interval
    testing?: boolean; //verbose zyre.js logging
    repl?: number //repl port zero is free port chosen by OS

}