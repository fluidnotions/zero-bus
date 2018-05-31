import { ZeroBus, DoneFunc, } from '../zero-bus';
import { map } from 'rxjs/operators';

let terminalConfig = { name: "test2", headers: { terminalId: "term2" }, iface: "Wireless Network Connection", debug: {ztrans: true, repl: 0, print: false} }
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            version: "v2",
            cmd: 'hello'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v2) ' + msg.name,
            })
        })
        zb.add({
            role: "patternTest2a",
            version: "v100",
            cmd: 'kill'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v2) ' + msg.name,
            })
        })
        zb.add({
            role: "patternTest2b",
            version: "v34",
            cmd: 'jump'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v2) ' + msg.name,
            })
        })
        zb.add({
            role: "patternTest2c",
            version: "v22",
            cmd: 'sing'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v2) ' + msg.name,
            })
        })

        // let to = 3000
        // let count = 0;
        // let i = setInterval(() => {
        //     let c = count++;
        //     // console.log(" gonna call act ", c, " now ...")
        //     // zb.act({
        //     //     cmd: 'hello',
        //     //     name: 'world'
        //     // }).subscribe((resp: any) => {
        //     //     console.log("response message from act ", c, "...", resp)
        //     //     // console.log("getPeerIps: "+b2.getPeerIps());
        //     // })
        //     // let ppsink = [];
        //     // zb.getPeerEndpoints().pipe(
        //     //     map((eds: string[]) => {
        //     //         console.log("eds: ", eds);
        //     //         return zb.getPeerPatterns(eds.length)
        //     //     })
        //     // ).subscribe((msg: any) => {
        //     //     console.log("msg: ", msg)
        //     // })
        //     clearInterval(i);
        // }, to)
    })
