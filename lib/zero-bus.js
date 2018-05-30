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
var ZeroBus = /** @class */ (function () {
    function ZeroBus(config, seneca) {
        this.config = config;
        this.seneca = seneca;
        this.actPromise = Promise.promisify(this.seneca.act, { context: this.seneca });
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
     * @param {(msg: any, done: DoneFunc) => any} cbFunc
     * @memberof ZeroBus
     */
    ZeroBus.prototype.add = function (msgUsedAsPattern, cbFunc) {
        this.seneca.add(msgUsedAsPattern, cbFunc);
    };
    /**
     * perform an action
     *
     * @param {*} msgArg
     * @returns {Promise<any>}
     * @memberof ZeroBus
     */
    ZeroBus.prototype.act = function (msgArg) {
        return this.actPromise(msgArg).catch(function (err) { return console.error("act failed: ", err); });
    };
    ZeroBus.prototype.getPeerIps = function () {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerIps' })
            .then(function (result) {
            return result.peerIps;
        }).catch(function (err) {
            // err will be set with a timeout error thrown by the gate executer
            console.error(err);
        });
    };
    return ZeroBus;
}());
exports.ZeroBus = ZeroBus;
//# sourceMappingURL=zero-bus.js.map