const Bloom = require('bloomrun');
const Zyre = require('zyre.js');
const ip = require('ip');
const uuidv4 = require('uuid/v4');
import { EventEmitter } from "events";
import { isEmpty, values, uniq } from "lodash";

export class Glue extends EventEmitter {
    constructor() {
        super();
    }
}

const ZyreConfigDefaults = {
    name: undefined,      // Name of the zyre node - required in constructor zyreConfig
    iface: 'eth0',    // Network interface
    headers: {        // Headers will be sent on every new connection
        ip: undefined, //provided by class
        terminalId: undefined //required in constructor zyreConfig
    },
    evasive: 5000,    // Timeout after which the local node will try to ping a not responding peer
    expired:  2147483647, //maximum positive value for a 32-bit signed binary integer  // Timeout after which a not responding peer gets disconnected
    port: 49152,      // Port for incoming messages, will be incremented if already in use
    bport: 5670,      // Discovery beacon broadcast port
    binterval: 1000,  // Discovery beacon broadcast interval
}

const DEFAULT_SERVICE_CHANNEL = "plugin-service-channel"
export interface MyPeerNode { originIp: string, terminalId: string, zyrePeerId: string, name: string };

export class ZeroBus {

    private localServiceCatalog: any;
    myIdentity: MyPeerNode;
    zyreInstance: any;
    glueInstance: Glue;
    constructor(config: any, public debugLogging: boolean = false) {
        let glue = this.glueInstance = new Glue()
        this.localServiceCatalog = Bloom();
        let myIp = ip.address();
        let zyreConfig = Object.assign({}, ZyreConfigDefaults, config);
        if (config.headers) {
            //apply defaults to nested 
            zyreConfig.headers = Object.assign({}, ZyreConfigDefaults.headers, config.headers);
        }
        zyreConfig.headers.ip = myIp;
        let zyre = this.zyreInstance = new Zyre(zyreConfig);
        this.zyreInstance.setEncoding('utf8');
        let zyrePeerId = this.zyreInstance.getIdentity()
        this.myIdentity = { originIp: myIp, terminalId: config.headers.terminalId, zyrePeerId: zyrePeerId, name: zyreConfig.name };
        if (debugLogging) {
            let me = this.myIdentity.terminalId;
            this.zyreInstance.on('connect', (id: any, name: any, headers: any) => {
                console.log("DEBUG:  [", me, "] on connect: ", { id, name, headers })
            })
            this.zyreInstance.on('disconnect', (id: any, name: any) => {
                console.log("DEBUG:  [", me, "] on disconnect: ", { id, name })
            });
            this.zyreInstance.on('expired', (id: any, name: any) => {
                console.log("DEBUG:  [", me, "] on expired: ", { id, name })
            });
            this.zyreInstance.on('join', (id: any, name: any, group: any) => {
                if (group === DEFAULT_SERVICE_CHANNEL) console.log("DEBUG:  [", me, "] on join: ", { id, name })
            });
            this.zyreInstance.on('leave', (id: any, name: any, group: any) => {
                if (group === DEFAULT_SERVICE_CHANNEL) console.log("DEBUG:  [", me, "] on leave: ", { id, name })
            });
        }

        //zyreInstance event handlers go here ...
        this.zyreInstance.on('whisper', (id: string, name: string, message: string) => {
            if (debugLogging) console.log("##### whisper recieved by ", this.myIdentity, " args: ", { id, name, message })
            let msg: Message = JSON.parse(message);
            //now emit on msguuid so any acts can resolve there promises
            glue.emit(msg.msguuid, msg);
        });
        this.zyreInstance.on('shout', (id: string, name: string, message: string, group: string) => {
            if (debugLogging) console.log("on shout: group: ", group)
            if (group === DEFAULT_SERVICE_CHANNEL) {
                let msg: Message = JSON.parse(message);
                if (debugLogging) console.log("on channel recieve: parsed message: ", msg)
                let resMsg = this.localExecAction(msg);
                if (debugLogging) console.log("on channel recieve: after localExecAction resMsg: ", resMsg)
                //if pattern found locally and exec has given us a response send it directly back to the caller via whisper
                if (resMsg) {
                    if(msg.myNode.zyrePeerId){
                        zyre.whisper(msg.myNode.zyrePeerId, JSON.stringify(resMsg));
                    }
                    
                } else {
                    if (debugLogging) console.log("on channel recieve: after localExecAction resMsg: ", resMsg)
                }
            }
        });



    }

    getPeerIps(online: boolean = true): string[] {
        //zyre peer:
        // {   name: 'test2',
        //     endpoint: 'tcp://192.168.8.103:49153',
        //     headers: { ip: '192.168.56.1', terminalId: 'term2' },
        //     groups: [ 'plugin-service-channel' ],
        //     evasive: false }
        return uniq(//remove duplicate ips
            values(this.zyreInstance.getPeers())
            .filter(p => {
                return !p.evasive == online
            }).map(p => p.headers.ip)
            .concat(this.myIdentity.originIp)//add in self -- seems to be excluded from getPeers()
        )
    }

    init(): Promise<ZeroBus> {
        return this.zyreInstance.start()
            .then(() => {

                this.zyreInstance.join(DEFAULT_SERVICE_CHANNEL);
                return this;

            })
    }

    /**
     * adds to local service catalog instance
     * the power of pattern matching comes from the fact that the message itself is the pattern matched against and that 
     * which is parsed into the associated function. Loose coupling, the message has no knowlege of the handler of it.
     * 
     * @param {*} msgUsedAsPattern 
     * @param {() => any} func the added function is wrapped as a Message type object in localRunAction
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, func: (msg: any) => any): void {
        this.localServiceCatalog.add(msgUsedAsPattern, func);
    }


    /**
     * acts on any service catalog instances, so has to lookup from all catalog instances attached via zyre.js
     * the result or response returned as a promise containing a Message type object
     * 
     * The fact that the channel/group doesn't exist unless there are at least 2 peers online is a bit of a problem 
     * in situations where event sourcing type behaviour might be expected
     * 
     * NB: in situations where we want response from many instances like a broadcast situation, will need to use streams instead of Promises which can only resolve once
     * 
     * @param {*} msg 
     * @param {number} [timeout] 
     * @returns {Promise<Message>} when DEFAULT_SERVICE_CHANNEL group gets any shout it calls localExecAction if found locally 
     * ie: localExecAction returns non-null then emits the returned message on the msguuid
     * @memberof ZeroBus
     */
    act(msgArg: any, timeout?: number): Promise<Message> {
        if (isEmpty(this.zyreInstance.getPeers())) {//when there are no open peers online the channel doesn't -- this is a fast workaround - try direct localExecAction
            console.warn("no other peers online, skipping channel, looking for a local match")
            return new Promise((resolve, reject) => {
                let message = new Message(uuidv4(), "request", MessageState.PENDING, this.myIdentity, msgArg)
                let msg = this.localExecAction(message);
                if (msg) {
                    resolve(msg);
                } else {
                    resolve();
                }

                //if we never get a response back in a sec timeout
                if (timeout) {
                    setTimeout(() => {
                        console.warn('Timed out in ' + timeout + 'ms. [message: ',message,"]")
                        resolve(new Message(message.msguuid, "request", MessageState.TIMEOUT, null));
                    }, timeout)
                }
            })
        } else {
            return new Promise((resolve, reject) => {
                let message = new Message(uuidv4(), "request", MessageState.PENDING, this.myIdentity, msgArg)
                // console.log("shout msg: ", message)
                this.zyreInstance.shout(DEFAULT_SERVICE_CHANNEL, JSON.stringify(message));
                this.glueInstance.once(message.msguuid, (msg: Message) => {
                    if (msg) {
                        resolve(msg);
                    } else {
                        resolve();
                    }
                })
                //if we never get a response back in a sec timeout
                if (timeout) {
                    setTimeout(() => {
                        // console.warn('Timed out in ' + timeout + 'ms. [message: ',message,"]") //prints this in the case where there is no function in local service catelog
                        resolve(new Message(message.msguuid, "request", MessageState.TIMEOUT, null));//since promise can only be resolved once in the case of no function in local service catelog this has no effect
                    }, timeout)
                }
            })
        }


    }

    //

    /**
     * do local catalog lookup and execute associated function then return response Message type object
     * 
     * @private
     * @param {Message} msg 
     * @returns {Message} is a new message of response type but has the same uuid as the arg request type message, in the case of error or timeout undefined is resolved in the promise
     * @memberof ZeroBus
     */
    private localExecAction(msg: Message): Message | null {
        let func = this.localServiceCatalog.lookup(msg.content)
        if (func) {
            let res;
            try {
                res = func(msg.content)
            } catch (err) {
                return new Message(msg.msguuid, "response", MessageState.ERROR, this.myIdentity, err);
            }
            return new Message(msg.msguuid, "response", MessageState.COMPLETE, this.myIdentity, res);
        } else {
            console.warn(msg, " pattern not found in local service catalog: ", this.myIdentity)
            return null;
        }
    }

}

export enum MessageState {
    ERROR = "error",
    PENDING = "pending",
    COMPLETE = "complete",
    TIMEOUT = "timeout"
}

export class Message {
    constructor(public msguuid: string, public type: 'request' | 'response', public state: string, public myNode: MyPeerNode | null, public content?: any) { }
}

