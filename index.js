exports.parse = function (stream, cb) {
    var next = cb(undefined, deferCallback)

    function deferCallback (t) {
        if (next !== DEFER) {
            throw new Error('refusing to overwrite non-DEFER type');
        }
        next = t
    }

    function read () {
        var chunk
        while (next !== undefined && next !== DONE &&
            next !== DEFER && (chunk = stream.read(next.len)) !== null) {

            if (!(next.get instanceof Function)) {
                next = next.get
                return
            }
            next = cb(next.get.apply(chunk, [0]), deferCallback)
        }
    }
    // Optimistically read any data from the internal buffer before
    // we start listening to 'readable' events. There are certain
    // situations where data is available before a 'readable' event
    // has been fired, e.g. someone listening to 'readable' upstream.
    read()
    stream.on('readable', read)
}

var DONE = exports.DONE = {}
var DEFER = exports.DEFER = {}

var Buf = exports.Buffer = function (len) {
    if (!(this instanceof Buf)) return new Buf(len)
    this.len = len
    this.get = function () {
        return this
    }
}

var Skip = exports.Skip = function (len, next) {
    if (!(this instanceof Skip)) return new Skip(len, next)
    this.len = len
    this.get = next
}

var Str = exports.String = function (len, encoding) {
    if (!(this instanceof Str)) return new Str(len, encoding)
    this.len = len
    this.get = function () {
        return this.toString(encoding)
    }
}

// export all node buf.readXXX methods as our own
for (var funcName in Buffer.prototype) {
    if (funcName.substring(0, 4) === 'read') {
        var bits = funcName.match(/\d+/g)

        var byteLen
        if (bits !== null) {
            byteLen = parseInt(bits[0]) / 8
        } else if (funcName.substring(0, 9) === 'readFloat') {
            byteLen = 4
        } else if (funcName.substring(0, 10) === 'readDouble') {
            byteLen = 8
        }

        exports[funcName] = {
            get : Buffer.prototype[funcName],
            len : byteLen
        }
    }
}
