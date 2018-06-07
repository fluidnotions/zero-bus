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
var Patrun = require('patrun');
var Jsonic = require('jsonic');
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var _ = require("lodash");
var util_1 = require("./util");
var debug = true;
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
    ZeroBus.prototype.act = function (msgArg, take) {
        var _this = this;
        return rxjs_1.Observable.create(function (o) {
            _this.seneca.act(msgArg, function (err, out) {
                if (debug)
                    console.log(err && err.message || out);
                if (err)
                    o.error(err);
                var observed$ = out.observed$;
                o.next(out);
                if (!observed$) {
                    o.complete();
                }
            });
        }).pipe(operators_1.bufferCount(take || 1));
    };
    /**
     * in situations where actor functions respond with observed$:true
     * we can use findPeersWithPattern(pat) to find out how many responses
     * to expect and can aggregate the reults and the complete the observable
     *
     * @param {*} msgArg
     * @returns {Observable<any[]>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.observeActAggregate = function (msgArg) {
        var _this = this;
        return this.findPeersWithPattern(msgArg)
            .pipe(operators_1.flatMap(function (matches) {
            var takeNum = matches.length > 0 ? matches.length : 1;
            return _this.act(msgArg, takeNum).pipe(operators_1.map(function (r) { return r; }));
        }));
    };
    /**
     * filters getPeerEndpoints result removing ports and duplicates
     *
     * @returns {Observable<string[]>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerIps = function () {
        return this.getPeerEndpoints()
            .pipe(operators_1.map(function (ends) {
            if (debug)
                console.log("ends: ", ends);
            var ips = ends.map(function (e) {
                if (e.indexOf(":") > 1) {
                    return e.split(":")[0];
                }
                else {
                    return e;
                }
            });
            if (debug)
                console.log("ip: ", ips);
            var uniqIps = _.uniq(ips);
            if (debug)
                console.log("uniqIps: ", uniqIps);
            return uniqIps;
        }));
    };
    /**
     * contains duplicates, since we are likely to have local peer process but there ports are included,
     * we need the dups to get the number of peers so we can take that number from the
     *
     * FIXME: this is only returning 1 ip, should return all processes on various ports
     *
     * @returns {Observable<string[]>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerEndpoints = function () {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerEndpoints' }).pipe(operators_1.map(function (resp) {
            var result = resp[0];
            if (debug)
                console.log("peer endpoints: ", result); //peer endpoints:  [ { peerIps: [ '10.50.113.218' ] } ]
            return result.peerIps;
        }));
    };
    /**
     * get latest patterns collected from all connected peers, these can be process or network peers
     *
     * @returns {Observable<any>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerPatterns = function () {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerPatterns' }).pipe(operators_1.map(function (resp) {
            var result = (_.isArray(resp) && resp.length == 1) ? resp[0] : resp;
            if (debug)
                console.log("peer patterns: ", result);
            return result;
        }));
    };
    /**
     * build a map of patrun instances for each peer containing that patterns
     * collected from all the peers
     *
     * @returns {Observable<Dictionary<any[]>>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.getPeerPatrunMap = function () {
        var peersToPatrunDict = {};
        return this.getPeerPatterns().pipe(operators_1.map(function (pps) {
            Object.keys(pps).map(function (k) {
                var pm = Patrun({ gex: true });
                pps[k].map(function (p) { return pm.add(p, true); }); //build patrun instance for peer
                peersToPatrunDict[k] = pm;
            });
            return peersToPatrunDict;
        }));
    };
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
    ZeroBus.prototype.findPeersWithPattern = function (pattern) {
        //treat pat the same os seneca internals do
        var pat = _.isString(pattern) ? Jsonic(pattern) : pattern;
        pat = util_1.clean(pat);
        pat = pat || {};
        //list peer ids that have a match
        var peersWithMatch = [];
        return this.getPeerPatrunMap().pipe(operators_1.map(function (peersToPatrunDict) {
            Object.keys(peersToPatrunDict).map(function (k) {
                var peerPatrun = peersToPatrunDict[k];
                if (debug) {
                    console.log("pat run instance: ", peerPatrun);
                    console.log("pat run list: ", peerPatrun.list());
                    console.log("pat to find: ", pat);
                }
                if (peerPatrun.find(pat, { exact: false }) !== null) {
                    peersWithMatch.push(k);
                }
            });
            return peersWithMatch;
        }));
    };
    return ZeroBus;
}());
exports.ZeroBus = ZeroBus;
//# sourceMappingURL=zero-bus.js.map