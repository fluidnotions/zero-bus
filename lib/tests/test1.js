"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", debug: { ztrans: false, repl: 0, print: true } };
zero_bus_1.ZeroBus.instance(terminalConfig)
    .then(function (zb) {
    zb.add({
        version: "v0",
        cmd: 'hello'
    }, function (msg, done) {
        done(null, {
            result: 'hello (v0) ' + msg.name,
        });
    });
    var to = 5000;
    var count = 0;
    var i = setInterval(function () {
        var c = count++;
        console.log(" gonna call act v2 ", c, " now ...");
        zb.act({
            version: "v2",
            cmd: 'hello',
            name: 'Dude'
        }).then(function (resp) {
            console.log("response message from v2 act ", c, "...", resp);
        });
        // clearInterval(i);
    }, to * 2);
});
//# sourceMappingURL=test1.js.map