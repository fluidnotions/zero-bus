import { ZeroBus, DoneFunc, } from '../zero-bus';
import { map } from 'rxjs/operators';

let iface1 = "Wireless Network Connection";
let iface2 = "Local Area Connection";
let terminalConfig = { name: "test2", headers: { terminalId: "term2" }, iface: iface2, debug: {ztrans: false, repl: undefined, print: true} }
ZeroBus.instance(terminalConfig)
    .then((zb: ZeroBus) => {
        zb.add({
            cmd: 'hello',
            role: 'sister'
        }, (msg: any, done: DoneFunc) => {
            done(null, {
                result: 'hello (v0) [from test2]' + msg.name,
                observed$: true
            })
        })
    })
