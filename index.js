exports.parse = function (stream, cb) {

    var next = cb()

    stream.on('readable', function () {
        var chunk
        while (next !== undefined && (chunk = stream.read(next.len)) !== null) {

            if (!(next.get instanceof Function)) {
                next = next.get
                return
            }

            next = cb(next.get.apply(chunk, [0]))
        }
    })
}

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

var DONE = exports.DONE = undefined

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
