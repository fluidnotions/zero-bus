import { ZeroBus, DoneFunc } from "../zero-bus";
import { Observable } from 'rxjs';
import { map, flatMap, take } from 'rxjs/operators';

let iface1 = "Wireless Network Connection";
let iface2 = "Local Area Connection";
let terminalConfig = { name: "test3", headers: { terminalId: "term3" }, iface: iface2, debug: {ztrans: false, repl: undefined, print: true} };
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
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
    })

