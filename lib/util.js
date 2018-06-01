"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// from seneca -- wanna use the same logic for pattern matching to get consistant results
// remove any props containing $
exports.clean = function (obj, opts) {
    if (null == obj)
        return obj;
    var out = Array.isArray(obj) ? [] : {};
    var pn = Object.getOwnPropertyNames(obj);
    for (var i = 0; i < pn.length; i++) {
        var p = pn[i];
        if ('$' != p[p.length - 1]) {
            out[p] = obj[p];
        }
    }
    if (opts && false !== opts.proto) {
        //out.__proto__ = obj.__proto__
    }
    return out;
};
//# sourceMappingURL=util.js.map