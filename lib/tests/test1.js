"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = require("../main");
var b1 = new main_1.ZeroBus({ name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection" }, true);
b1.add({
    cmd: 'hello'
}, function (msg) {
    return {
        result: 'hello ' + msg.name,
        zbInstanceIdentity: b1.myIdentity
    };
});
//inter coms
b1.init().then(function (zb) {
    var to = 5000;
    setTimeout(function () {
        zb.getPeerIps();
    }, to);
    // setTimeout(() => {
    //     console.log(" gonna call dummy v2 now ...")
    //     zb.act({
    //         cmd: 'hello',
    //         version: "v2",
    //         name: 'Justin'
    //     }).then((resp: Message) => {
    //         console.log("response message from v2 act...", resp)
    //     })
    // }, to)
    var count = 0;
    var i = setInterval(function () {
        var c = count++;
        console.log(" gonna call act v2 ", c, " now ...");
        zb.act({
            cmd: 'hello',
            version: "v2",
            name: 'Justin'
        }).then(function (resp) {
            console.log("response message from v2 act ", c, "...", resp);
        });
        // clearInterval(i);
    }, to * 2);
});
//coms with self if no other peers are connected
// b1.init().then((zb: ZeroBus) => {
//     let to = 5000
//     setTimeout(() => {
//         console.log(" gonna call dummy act now ...")
//         zb.act({
//             cmd: 'hello',
//             name: 'world'
//         }).then((resp: Message) => {
//             console.log("response message from dummy act...")
//             console.log(resp)
//         })
//     }, to)
// })
//# sourceMappingURL=test1.js.map