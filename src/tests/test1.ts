import { ZeroBus, DoneFunc } from "../zero-bus";
import { Observable } from 'rxjs';
import { map, flatMap, take } from 'rxjs/operators';

let iface1 = "Wireless Network Connection";
let iface2 = "Local Area Connection";
let terminalConfig = { name: "test1", headers: { terminalId: "term1" }, iface: iface2, debug:  {ztrans: false, repl: undefined, print: true} };
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            cmd: 'hello',
            role: 'sister'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v0) [from test1]' + msg.name,
                observed$: true
            })
        })
    })

