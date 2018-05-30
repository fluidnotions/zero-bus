import { ZeroBus, DoneFunc, } from '../zero-bus';

let terminalConfig = { name: "test2", headers: { terminalId: "term2" }, iface: "Wireless Network Connection", testing: true }
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            cmd: 'hello',
            version: "v2"
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v2) ' + msg.name,
            })
        })

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
    })
