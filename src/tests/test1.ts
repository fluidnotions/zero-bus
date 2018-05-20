import { ZeroBus, Message } from '../main';

let b1 = new ZeroBus({ name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection" });
b1.add({
    cmd: 'hello'
}, (msg: any) => {
    return {
        result: 'hello ' + msg.name,
        // zbInstanceIdentity: b1.myIdentity
    }
})
//inter coms
b1.init().then((zb: ZeroBus) => {
    let to = 5000
    setTimeout(() => {
     zb.getPeerIps();
    }, to)
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
    let count = 0;
    let i = setInterval(() => {
        let c = count++;
        console.log(" gonna call act v2 ",c," now ...")
        zb.act({
            cmd: 'hello',
            version: "v2",
            name: 'Justin'
        }).then((resp: Message) => {
            console.log("response message from v2 act ",c,"...", resp.content)
        })
        // clearInterval(i);
    }, to*2)
})
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
