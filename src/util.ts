// from seneca -- wanna use the same logic for pattern matching to get consistant results
// remove any props containing $
export const clean = (obj, opts?) => {
    if (null == obj) return obj
  
    var out = Array.isArray(obj) ? [] : {}
  
    var pn = Object.getOwnPropertyNames(obj)
    for (var i = 0; i < pn.length; i++) {
      var p = pn[i]
  
      if ('$' != p[p.length - 1]) {
        out[p] = obj[p]
      }
    }
  
    if (opts && false !== opts.proto) {
      //out.__proto__ = obj.__proto__
    }
  
    return out
  }