# zer0-bus

pattern matching service bus over local area networks 

- works without administration or configuration
- Peers can join or leave the network at any time
- Peers can communicate directly with each other; no central server or message broker needed
- Peer discovery usually takes less than a second

thin typescript wrapper around seneca using seneca-zyre-transport (zyre.js)

## Quick Example
**examples can be found in src/tests folder**
```js
import { ZeroBus, DoneFunc } from "zer0-bus";

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
        zb.act({
            cmd: 'hello',
            //version: "v2",
            name: 'Dude'
        }).then((resp: any) => {
            console.log("response message from v2 act ", c, "...", resp)
        })
    })
```
