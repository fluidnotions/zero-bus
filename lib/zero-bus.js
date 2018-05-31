"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var ztrans = require('seneca-zyre-transport');
var Seneca = require('seneca');
var Promise = require('bluebird');
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var ZeroBus = /** @class */ (function () {
    function ZeroBus(config, seneca) {
        this.config = config;
        this.seneca = seneca;
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
    ZeroBus.default = function (args, debug) {
        var config = {
            name: args.name,
            headers: {
                terminalId: args.terminalId
            },
            iface: args.iface
        };
        if (debug) {
            config.debug = debug;
        }
        return ZeroBus.instance(config);
    };
    /**
     *
     *
     * @static
     * @param {ZbConfig} config
     * @returns {Promise<ZeroBus>}
     * @memberof ZeroBus
     */
    ZeroBus.instance = function (config) {
        return new Promise(function (resolve) {
            var seneca = Seneca({
                tag: config.name
            })
                .use(ztrans, {
                zyre: __assign({}, config)
            })
                .client({ type: 'zyre' })
                .listen({ type: 'zyre' });
            if (config.debug) {
                if (config.debug.repl !== undefined)
                    seneca.use('seneca-repl', { port: config.debug.repl });
                if (config.debug.print)
                    seneca.test('print');
            }
            seneca.ready(function () {
                //add getPeerPatterns to self so we can get patterns from all peers --it can't be def in transport, 
                //case then when we call act the local will get hit. But we can create a seperate one call client
                this.add({ role: 'p2p', type: 'zyre', cmd: 'getPeerPatterns', }, get_peer_patterns);
                function get_peer_patterns(msg, done) {
                    var seneca = this;
                    //remove role:transport and role:seneca
                    var patterns = seneca.list(); //.filter(p => !p.role || (p.role !== 'transport' && p.role !== 'seneca'))
                    var id = seneca.id;
                    console.log("get_peer_patterns: self Id: ", id, " patterns(no filtered): ", patterns);
                    done(null, {
                        id: id,
                        patterns: patterns,
                        observed$: true
                    });
                }
                resolve(new ZeroBus(config, this));
            });
        });
    };
    /**
     *  You must always call the done: DoneFunc function, at the end of your cbFunc implementation,
     *  even when there is no response data, as this lets Seneca know that the action is complete.
     *
     * @param {*} msgUsedAsPattern jsonic can be used, the order of key/values seems to be important, pattern match seem a little iffy, be sure to test
     * @param {(msg: any, done: DoneFunc) => any} cbFunc where DoneFunc has a declaration of (error: any, responseMsg: any) => void & can add observed$: true as prop to responseMsg for multiple responses
     * @memberof ZeroBus
     */
    ZeroBus.prototype.add = function (msgUsedAsPattern, cbFunc) {
        this.seneca.add(msgUsedAsPattern, cbFunc);
    };
    /**
     * perform an action, returns an observable reponse or stream of responses
     *
     * @param {*} msgArg
     * @returns {Observable<any>} the response msg(s) if the msg contains observed$: true stream remains open else it is completed
     * @memberof ZeroBus
     */
    ZeroBus.prototype.act = function (msgArg) {
        var _this = this;
        return rxjs_1.Observable.create(function (o) {
            _this.seneca.act(msgArg, function (err, out) {
                console.log(err && err.message || out);
                if (err)
                    o.error(err);
                var observed$ = out.observed$;
                o.next(out);
                if (!observed$) {
                    o.complete();
                }
            });
        });
    };
    /**
     * contains duplicates, since we are likely to have local peer process but there ports are included,
     * we need the dups to get the number of peers so we can take that number from the
     *
     * @returns {Observable<string[]>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerEndpoints = function () {
        //this ends up being called locally cause it;s defined in the transport plugin we are using
        //if you call act and the pattern exists locally it won't be broadcast to other peers
        //FIXME: would be better if we could isolate this code and extert some controll
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerEndpoints' }).pipe(operators_1.map(function (result) {
            console.log("result: ", result);
            return result.peerIps;
        }));
    };
    /**
     *
     *
     * @param {ZbConfig} config
     * @param {number} takePeers will complete the observable after we have the responses we want
     * @returns {Observable<any>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerPatterns = function (takePeers) {
        var conf = this.config;
        //create standalone seneca client instance which unlike our main doesn't have role:p2p, thereby insuring the request will be broadcast
        return rxjs_1.Observable.create(function (o) {
            Seneca()
                .use(ztrans, {
                zyre: __assign({}, conf, { terminalId: undefined, name: "ONCE_OFF_GET_PATTERNS_CLIENT", debug: { ztrans: true, repl: 0, print: true } })
            })
                .client({ type: 'zyre' })
                .ready(function () {
                this.act({ role: 'p2p', type: 'zyre', cmd: 'getPeerPatterns' }, function (err, out) {
                    console.log("getPeerPatterns: res: ", err && err.message || out);
                    if (err)
                        o.error(err);
                    o.next(out);
                    // this.close()
                });
            });
        });
        //.pipe(take(takePeers))
    };
    return ZeroBus;
}());
exports.ZeroBus = ZeroBus;
//# sourceMappingURL=zero-bus.js.map