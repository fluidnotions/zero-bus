import { ZeroBus, DoneFunc } from "../zero-bus";
import { Observable } from 'rxjs';
import { map, flatMap, take } from 'rxjs/operators';

let terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: "Wireless Network Connection", debug: {ztrans: false, repl: 0, print: false} };
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

        let to = 3000
        let count = 0;
        let i = setInterval(() => {
            let c = count++;
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
            let ppsink = [];
            zb.getPeerEndpoints().pipe(flatMap((eds: any) => {
                console.log("eds: ", eds);
                return zb.getPeerPatterns(eds.length)
            })).subscribe((msg: any) => {
                console.log("msg: ", msg)
            })
            clearInterval(i);
        }, to)
    })

