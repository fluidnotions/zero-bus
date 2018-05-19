"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Bloom = require('bloomrun');
var Zyre = require('zyre.js');
var ip = require('ip');
var uuidv4 = require('uuid/v4');
var events_1 = require("events");
var lodash_1 = require("lodash");
var Glue = /** @class */ (function (_super) {
    __extends(Glue, _super);
    function Glue() {
        return _super.call(this) || this;
    }
    return Glue;
}(events_1.EventEmitter));
exports.Glue = Glue;
var ZyreConfigDefaults = {
    name: undefined,
    iface: 'eth0',
    headers: {
        ip: undefined,
        terminalId: undefined //required in constructor zyreConfig
    },
    evasive: 5000,
    expired: 2147483647,
    port: 49152,
    bport: 5670,
    binterval: 1000,
};
var DEFAULT_SERVICE_CHANNEL = "plugin-service-channel";
;
var ZeroBus = /** @class */ (function () {
    function ZeroBus(config, debugLogging) {
        if (debugLogging === void 0) { debugLogging = false; }
        var _this = this;
        this.debugLogging = debugLogging;
        var glue = this.glueInstance = new Glue();
        this.localServiceCatalog = Bloom();
        var myIp = ip.address();
        var zyreConfig = Object.assign({}, ZyreConfigDefaults, config);
        if (config.headers) {
            //apply defaults to nested 
            zyreConfig.headers = Object.assign({}, ZyreConfigDefaults.headers, config.headers);
        }
        zyreConfig.headers.ip = myIp;
        var zyre = this.zyreInstance = new Zyre(zyreConfig);
        this.zyreInstance.setEncoding('utf8');
        var zyrePeerId = this.zyreInstance.getIdentity();
        this.myIdentity = { originIp: myIp, terminalId: config.headers.terminalId, zyrePeerId: zyrePeerId, name: zyreConfig.name };
        if (debugLogging) {
            var me_1 = this.myIdentity.terminalId;
            this.zyreInstance.on('connect', function (id, name, headers) {
                console.log("DEBUG:  [", me_1, "] on connect: ", { id: id, name: name, headers: headers });
            });
            this.zyreInstance.on('disconnect', function (id, name) {
                console.log("DEBUG:  [", me_1, "] on disconnect: ", { id: id, name: name });
            });
            this.zyreInstance.on('expired', function (id, name) {
                console.log("DEBUG:  [", me_1, "] on expired: ", { id: id, name: name });
            });
            this.zyreInstance.on('join', function (id, name, group) {
                if (group === DEFAULT_SERVICE_CHANNEL)
                    console.log("DEBUG:  [", me_1, "] on join: ", { id: id, name: name });
            });
            this.zyreInstance.on('leave', function (id, name, group) {
                if (group === DEFAULT_SERVICE_CHANNEL)
                    console.log("DEBUG:  [", me_1, "] on leave: ", { id: id, name: name });
            });
        }
        //zyreInstance event handlers go here ...
        this.zyreInstance.on('whisper', function (id, name, message) {
            if (debugLogging)
                console.log("##### whisper recieved by ", _this.myIdentity, " args: ", { id: id, name: name, message: message });
            var msg = JSON.parse(message);
            //now emit on msguuid so any acts can resolve there promises
            glue.emit(msg.msguuid, msg);
        });
        this.zyreInstance.on('shout', function (id, name, message, group) {
            if (debugLogging)
                console.log("on shout: group: ", group);
            if (group === DEFAULT_SERVICE_CHANNEL) {
                var msg = JSON.parse(message);
                if (debugLogging)
                    console.log("on channel recieve: parsed message: ", msg);
                var resMsg = _this.localExecAction(msg);
                if (debugLogging)
                    console.log("on channel recieve: after localExecAction resMsg: ", resMsg);
                //if pattern found locally and exec has given us a response send it directly back to the caller via whisper
                if (resMsg) {
                    if (msg.myNode.zyrePeerId) {
                        zyre.whisper(msg.myNode.zyrePeerId, JSON.stringify(resMsg));
                    }
                }
                else {
                    if (debugLogging)
                        console.log("on channel recieve: after localExecAction resMsg: ", resMsg);
                }
            }
        });
    }
    ZeroBus.prototype.getPeerIps = function (online) {
        if (online === void 0) { online = true; }
        //zyre peer:
        // {   name: 'test2',
        //     endpoint: 'tcp://192.168.8.103:49153',
        //     headers: { ip: '192.168.56.1', terminalId: 'term2' },
        //     groups: [ 'plugin-service-channel' ],
        //     evasive: false }
        return lodash_1.uniq(//remove duplicate ips
        lodash_1.values(this.zyreInstance.getPeers())
            .filter(function (p) {
            return !p.evasive == online;
        }).map(function (p) { return p.headers.ip; })
            .concat(this.myIdentity.originIp) //add in self -- seems to be excluded from getPeers()
        );
    };
    ZeroBus.prototype.init = function () {
        var _this = this;
        return this.zyreInstance.start()
            .then(function () {
            _this.zyreInstance.join(DEFAULT_SERVICE_CHANNEL);
            return _this;
        });
    };
    /**
     * adds to local service catalog instance
     * the power of pattern matching comes from the fact that the message itself is the pattern matched against and that
     * which is parsed into the associated function. Loose coupling, the message has no knowlege of the handler of it.
     *
     * @param {*} msgUsedAsPattern
     * @param {() => any} func the added function is wrapped as a Message type object in localRunAction
     * @memberof ZeroBus
     */
    ZeroBus.prototype.add = function (msgUsedAsPattern, func) {
        this.localServiceCatalog.add(msgUsedAsPattern, func);
    };
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
    ZeroBus.prototype.act = function (msgArg, timeout) {
        var _this = this;
        if (lodash_1.isEmpty(this.zyreInstance.getPeers())) { //when there are no open peers online the channel doesn't -- this is a fast workaround - try direct localExecAction
            console.warn("no other peers online, skipping channel, looking for a local match");
            return new Promise(function (resolve, reject) {
                var message = new Message(uuidv4(), "request", MessageState.PENDING, _this.myIdentity, msgArg);
                var msg = _this.localExecAction(message);
                if (msg) {
                    resolve(msg);
                }
                else {
                    resolve();
                }
                //if we never get a response back in a sec timeout
                if (timeout) {
                    setTimeout(function () {
                        console.warn('Timed out in ' + timeout + 'ms. [message: ', message, "]");
                        resolve(new Message(message.msguuid, "request", MessageState.TIMEOUT, null));
                    }, timeout);
                }
            });
        }
        else {
            return new Promise(function (resolve, reject) {
                var message = new Message(uuidv4(), "request", MessageState.PENDING, _this.myIdentity, msgArg);
                console.log("shout msg: ", message);
                _this.zyreInstance.shout(DEFAULT_SERVICE_CHANNEL, JSON.stringify(message));
                _this.glueInstance.once(message.msguuid, function (msg) {
                    if (msg) {
                        resolve(msg);
                    }
                    else {
                        resolve();
                    }
                });
                //if we never get a response back in a sec timeout
                if (timeout) {
                    setTimeout(function () {
                        // console.warn('Timed out in ' + timeout + 'ms. [message: ',message,"]") //prints this in the case where there is no function in local service catelog
                        resolve(new Message(message.msguuid, "request", MessageState.TIMEOUT, null)); //since promise can only be resolved once in the case of no function in local service catelog this has no effect
                    }, timeout);
                }
            });
        }
    };
    //
    /**
     * do local catalog lookup and execute associated function then return response Message type object
     *
     * @private
     * @param {Message} msg
     * @returns {Message} is a new message of response type but has the same uuid as the arg request type message, in the case of error or timeout undefined is resolved in the promise
     * @memberof ZeroBus
     */
    ZeroBus.prototype.localExecAction = function (msg) {
        var func = this.localServiceCatalog.lookup(msg.content);
        if (func) {
            var res = void 0;
            try {
                res = func(msg.content);
            }
            catch (err) {
                return new Message(msg.msguuid, "response", MessageState.ERROR, this.myIdentity, err);
            }
            return new Message(msg.msguuid, "response", MessageState.COMPLETE, this.myIdentity, res);
        }
        else {
            console.warn(msg, " pattern not found in local service catalog: ", this.myIdentity);
            return null;
        }
    };
    return ZeroBus;
}());
exports.ZeroBus = ZeroBus;
var MessageState;
(function (MessageState) {
    MessageState["ERROR"] = "error";
    MessageState["SUCCESS"] = "success";
    MessageState["PENDING"] = "pending";
    MessageState["COMPLETE"] = "complete";
    MessageState["TIMEOUT"] = "timeout";
})(MessageState = exports.MessageState || (exports.MessageState = {}));
var Message = /** @class */ (function () {
    function Message(msguuid, type, state, myNode, content) {
        this.msguuid = msguuid;
        this.type = type;
        this.state = state;
        this.myNode = myNode;
        this.content = content;
    }
    return Message;
}());
exports.Message = Message;
//# sourceMappingURL=main.js.map