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
    ZeroBus.instance = function (config) {
        return new Promise(function (resolve) {
            Seneca({
                tag: config.name
            })
                .test('print')
                .use(ztrans, {
                zyre: __assign({}, config)
            })
                .client({ type: 'zyre' })
                .listen({ type: 'zyre' })
                .ready(function () {
                resolve(new ZeroBus(config, this));
            });
        });
    };
    ZeroBus.prototype.add = function (msgUsedAsPattern, func) {
        this.seneca.add(msgUsedAsPattern, func);
    };
    ZeroBus.prototype.act = function (msgArg) {
        return this.actPromise(msgArg).catch(function (err) { return console.error("act failed: ", err); });
    };
    ZeroBus.prototype.getPeerIps = function () {
        return this.act({ role: 'transport', type: 'zyre', cmd: 'getPeerIps', })
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