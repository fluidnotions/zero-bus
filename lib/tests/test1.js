"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var iface1 = "Wireless Network Connection";
var iface2 = "Local Area Connection";
var terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: iface2, debug: { ztrans: false, repl: undefined, print: true } };
zero_bus_1.ZeroBus.instance(terminalConfig)
    .then(function (zb) {
    zb.add({
        cmd: 'hello',
        role: 'sister'
    }, function (msg, done) {
        done(null, {
            result: 'hello (v0) [from test1]' + msg.name,
            observed$: true
        });
    });
});
//# sourceMappingURL=test1.js.map