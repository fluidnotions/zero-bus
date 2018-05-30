import { ZeroBus, DoneFunc } from "../zero-bus";

let terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", testing: true };
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            cmd: 'hello'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello ' + msg.name,
            })
        })
        let to = 5000
        let count = 0;
        let i = setInterval(() => {
            let c = count++;
            console.log(" gonna call act v2 ", c, " now ...")
            zb.act({
                cmd: 'hello',
                version: "v2",
                name: 'Dude'
            }).then((resp: any) => {
                console.log("response message from v2 act ", c, "...", resp)
            })
            // clearInterval(i);
        }, to * 2)
    })

