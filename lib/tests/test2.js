"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../main");
var b2 = new main_1.ZeroBus({ name: "test2", headers: { terminalId: "term2" }, iface: "Wireless Network Connection" });
b2.add({
    cmd: 'hello',
    version: "v2"
}, function (msg) {
    return {
        result: 'hello ' + msg.name,
        zbInstanceIdentity: b2.myIdentity
    };
});
b2.init().then(function (zb) {
    // let to = 3000
    // let count = 0;
    // let i = setInterval(() => {
    //     let c = count++;
    //     console.log(" gonna call act ",c," now ...")
    //     zb.act({
    //         cmd: 'hello',
    //         name: 'world'
    //     }).then((resp: Message) => {
    //         console.log("response message from act ",c,"...", resp)
    //         // console.log("getPeerIps: "+b2.getPeerIps());
    //     })
    //     clearInterval(i);
    // }, to)
});
//# sourceMappingURL=test2.js.map