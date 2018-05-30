"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var terminalConfig = { name: "test2", headers: { terminalId: "term2" }, iface: "Wireless Network Connection", testing: false, repl: 0 };
zero_bus_1.ZeroBus.instance(terminalConfig)
    .then(function (zb) {
    zb.add({
        version: "v2",
        cmd: 'hello'
    }, function (msg, done) {
        done(null, {
            result: 'hello (v2) ' + msg.name,
        });
    });
    // let to = 3000
    // let count = 0;
    // let i = setInterval(() => {
    //     let c = count++;
    //     console.log(" gonna call act ", c, " now ...")
    //     zb.act({
    //         cmd: 'hello',
    //         name: 'world'
    //     }).then((resp: any) => {
    //         console.log("response message from act ", c, "...", resp)
    //         // console.log("getPeerIps: "+b2.getPeerIps());
    //     })
    //     clearInterval(i);
    // }, to)
});
//# sourceMappingURL=test2.js.map