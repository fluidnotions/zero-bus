"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var operators_1 = require("rxjs/operators");
var terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", debug: { ztrans: false, repl: 0, print: false } };
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
    // let to = 5000
    // let count = 0;
    // let i = setInterval(() => {
    //     let c = count++;
    //     console.log(" gonna call act v2 ", c, " now ...")
    //     zb.act({
    //         version: "v2",
    //         cmd: 'hello',
    //         name: 'Dude'
    //     }).subscribe((resp: any) => {
    //         console.log("response message from v2 act ", c, "...", resp)
    //     })
    //     // clearInterval(i);
    // }, to * 2)
    var to = 3000;
    var count = 0;
    var i = setInterval(function () {
        var c = count++;
        // console.log(" gonna call act ", c, " now ...")
        // zb.act({
        //     cmd: 'hello',
        //     name: 'world'
        // }).subscribe((resp: any) => {
        //     console.log("response message from act ", c, "...", resp)
        //     // console.log("getPeerIps: "+b2.getPeerIps());
        // })
        console.log();
        console.log();
        console.log();
        var ppsink = [];
        zb.getPeerEndpoints().pipe(operators_1.flatMap(function (eds) {
            console.log("eds: ", eds);
            return zb.getPeerPatterns(eds.length);
        })).subscribe(function (msg) {
            console.log("msg: ", msg);
        });
        clearInterval(i);
    }, to);
});
//# sourceMappingURL=test1.js.map