export function parseOptions(opts: any) {
  const loc = document.location
  if (loc.search) {
    const parts = loc.search.substring(1).split('&')
    parts.forEach((part) => {
      const keyval = part.split('=')
      opts[keyval[0]] = keyval[1]
    })
  }
  // console.log(opts)
  // if(typeof opts.switcher === 'string') {
  //     console.log("parsing switcher")
  // }
  return opts
}

export const on = (elem: any, type: any, cb: any) =>
  elem.addEventListener(type, cb)
export const $ = (sel: any) => {
  return document.querySelector(sel)
}

export function genID(prefix: string) {
  return `${prefix}_${Math.floor(Math.random() * 10000)}`
}

export function toFlatString(obj: any) {
  return JSON.stringify(obj)
}

/*
export function GET_JSON(path, cb) {
    return new Promise((res,rej) => {
        console.log("fetching",path);
        const req = new XMLHttpRequest()
        req.onreadystatechange = function() {
            // console.log("got",req.readyState, req.status)
            if(req.readyState === 4) {
                if(req.status === 200) return res(JSON.parse(req.responseText));
                //if anything other than 200, reject it
                rej(req)
            }
            if(req.status === 500) rej(req);
            if(req.status === 404) rej(req);
        };
        req.open("GET",path,true);
        req.send();
    });
}


export function POST_JSON(path, payload) {
    // console.log("POSTING",path,payload);
    return new Promise((res,rej)=>{
        const req = new XMLHttpRequest();
        req.onreadystatechange = function() {
            if(req.readyState === 4 && req.status === 200) {
                try {
                    res(JSON.parse(req.responseText));
                } catch(e) {
                    rej(e);
                }
            }
            if(req.status === 500) rej(req);
            if(req.status === 404) rej(req);
        };
        req.onerror = (e) => rej(e);
        req.open("POST",path,true);
        req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        if(typeof payload === 'string') {
            req.send(payload)
        } else {
            req.send(JSON.stringify(payload));
        }
    })
}
 */

class Point {
  private x: number
  private y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  minus(pt: Point) {
    return new Point(this.x - pt.x, this.y - pt.y)
  }

  add(pt: Point) {
    return makePoint(this.x + pt.x, this.y + pt.y)
  }

  divide(v: number) {
    return makePoint(this.x / v, this.y / v)
  }

  multiply(v: number) {
    return makePoint(this.x * v, this.y * v)
  }

  idivide(v: number) {
    return makePoint(Math.floor(this.x / v), Math.floor(this.y / v))
  }

  floor() {
    return makePoint(Math.floor(this.x), Math.floor(this.y))
  }

  distance(pt: Point) {
    const dx = pt.x - this.x
    const dy = pt.y - this.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  equals(pt: Point) {
    return pt.x === this.x && pt.y === this.y
  }

  toString(): string {
    return `(${this.x},${this.y})`
  }
}
export function makePoint(x: number, y: number) {
  return new Point(x, y)
}

// use only capital letters, 65->90
export function genAlphaID(count: number) {
  let id = ''
  for (let i = 0; i < count; i++) {
    id += String.fromCharCode(65 + Math.floor(Math.random() * (90 - 65)))
  }
  return id
}

export function setQuery(obj: any) {
  const oldOpts = parseOptions({})
  const final = {}
  Object.keys(oldOpts).forEach((key) => (final[key] = oldOpts[key]))
  Object.keys(obj).forEach((key) => (final[key] = obj[key]))
  const query = Object.keys(final)
    .map((key) => `${key}=${final[key]}`)
    .join('&')
  window.history.pushState(obj, 'a title', '?' + query)
}
export function toQueryString(obj: any) {
  return Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join('&')
}

export function shallowCopy(obj: any) {
  const out = {}
  Object.keys(obj).forEach((key) => (out[key] = obj[key]))
  return out
}
