/// <reference types="node" />
import { EventEmitter } from "events";
export declare class Glue extends EventEmitter {
    constructor();
}
export interface MyPeerNode {
    originIp: string;
    terminalId: string;
    zyrePeerId: string;
    name: string;
}
export declare class ZeroBus {
    debug: boolean;
    verboseDebug: boolean;
    private localServiceCatalog;
    myIdentity: MyPeerNode;
    zyreInstance: any;
    glueInstance: Glue;
    constructor(config: any, debug?: boolean, verboseDebug?: boolean);
    getPeerIps(online?: boolean): string[];
    init(): Promise<ZeroBus>;
    /**
     * adds to local service catalog instance
     * the power of pattern matching comes from the fact that the message itself is the pattern matched against and that
     * which is parsed into the associated function. Loose coupling, the message has no knowlege of the handler of it.
     *
     * @param {*} msgUsedAsPattern
     * @param {() => any} func the added function is wrapped as a Message type object in localRunAction
     * @memberof ZeroBus
     */
    add(msgUsedAsPattern: any, func: (msg: any) => any): void;
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
    act(msgArg: any, timeout?: number): Promise<Message>;
    /**
     * do local catalog lookup and execute associated function then return response Message type object
     *
     * @private
     * @param {Message} msg
     * @returns {Message} is a new message of response type but has the same uuid as the arg request type message, in the case of error or timeout undefined is resolved in the promise
     * @memberof ZeroBus
     */
    private localExecAction(msg);
}
export declare enum MessageState {
    ERROR = "error",
    PENDING = "pending",
    COMPLETE = "complete",
    TIMEOUT = "timeout",
}
export declare class Message {
    msguuid: string;
    type: 'request' | 'response';
    state: string;
    myNode: any;
    content: any;
    constructor(msguuid: string, type: 'request' | 'response', state: string, myNode: any, content?: any);
}
