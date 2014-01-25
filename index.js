var assert = require('assert')

exports.parse = function (stream, cb) {

    var next = cb()

    stream.on('readable', function () {
        if (next === undefined || next === DONE) {
            return
        }
        assert(next.len)
        assert(next.get)

        var chunk = stream.read(next.len)
        if (!chunk) return
        assert(chunk.length === next.len)

        if (!(next.get instanceof Function)) {
            next = next.get
            return
        }

        next = cb(next.get.apply(chunk, [0]))
    })
}

exports.Buffer = function (len) {
    this.len = len
    this.get = function () {
        return this
    }
}

exports.Skip = function (len, next) {
    this.len = len
    this.get = next
}

exports.String = function (len, encoding) {
    this.len = len
    this.get = function () {
        return this.toString(encoding)
    }
}

var DONE = exports.DONE = null

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
