"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", testing: true };
zero_bus_1.ZeroBus.instance(terminalConfig)
    .then(function (zb) {
    zb.add({
        cmd: 'hello'
    }, function (msg, done) {
        done(null, {
            result: 'hello ' + msg.name,
        });
    });
    var to = 5000;
    var count = 0;
    var i = setInterval(function () {
        var c = count++;
        console.log(" gonna call act v2 ", c, " now ...");
        zb.act({
            cmd: 'hello',
            version: "v2",
            name: 'Dude'
        }).then(function (resp) {
            console.log("response message from v2 act ", c, "...", resp);
        });
        // clearInterval(i);
    }, to * 2);
});
//# sourceMappingURL=test1.js.map