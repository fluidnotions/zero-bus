import { ZeroBus, DoneFunc } from "../zero-bus";

let terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", testing: false, repl: 0 };
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            version: "v0",
            cmd: 'hello'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v0) ' + msg.name,
            })
        })
        let to = 5000
        let count = 0;
        let i = setInterval(() => {
            let c = count++;
            console.log(" gonna call act v2 ", c, " now ...")
            zb.act({
                version: "v2",
                cmd: 'hello',
                name: 'Dude'
            }).then((resp: any) => {
                console.log("response message from v2 act ", c, "...", resp)
            })
            // clearInterval(i);
        }, to * 2)
    })

