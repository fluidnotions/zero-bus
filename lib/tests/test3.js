"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zero_bus_1 = require("../zero-bus");
var iface1 = "Wireless Network Connection";
var iface2 = "Local Area Connection";
var terminalConfig = { name: "test3", headers: { terminalId: "term3" }, iface: iface2, debug: { ztrans: false, repl: undefined, print: true } };
zero_bus_1.ZeroBus.instance(terminalConfig)
    .then(function (zb) {
    // let to = 3000
    // let count = 0;
    // let i = setInterval(() => {
    //     let c = count++;
    //     // zb.act({
    //     //     cmd: 'hello',
    //     //     role: 'sister',
    //     //     name: 'Tedd Bundy'
    //     // }).subscribe((res: any) => {
    //     //     console.log("response: ", res)
    //     // })
    //     zb.observeActAggregate({
    //         cmd: 'hello',
    //         role: 'sister',
    //         name: 'Tedd Bundy'
    //     }).subscribe((res: any[]) => {
    //         console.log("responses: ", res)
    //     })
    //     clearInterval(i);
    // }, to)
    zb.getPeerIps().subscribe();
});
//# sourceMappingURL=test3.js.map