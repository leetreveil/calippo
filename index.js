var through2 = require('through2')
var bl = require('bl')
var xtend = require('xtend/mutable')

module.exports = function (options, cb) {
    if (typeof options === 'function') {
        cb = options
        options = {}
    }
 
    var ctx = through2(options, function (input, encoding, callback) {
        buffer.append(input)
        read()
        callback()
    })

    xtend(ctx, buildBufReadMethods(), {
        'Buffer': function (len) {
            return {'len': len, 'get': function () { return this }}
        },
        'Skip': function (len) {
            return {'len': len, 'get': function () { return null }}
        },
        'String': function (len, encoding) {
            return {'len': len, 'get': function () { return this.toString(encoding) }}
        },
        'defer': function (t) {
            if (next !== ctx.DEFER) {
                throw new Error('refusing to overwrite non-DEFER type')
            }
            next = t
            read()
        },
        'DEFER': {}
    })

    var buffer = new bl()
    var next = cb.apply(ctx, [undefined])

    function read () {
        var chunk
        var offset = 0
        while (next !== undefined && next !== ctx.DEFER &&
            (chunk = buffer.slice(offset, offset + next.len)).length === next.len) {

            offset += chunk.length
            next = cb.apply(ctx, [next.get.apply(chunk, [0])])
        }
        buffer.consume(offset)
    }

    return ctx
}

function buildBufReadMethods () {
    var out = {}
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

            out[funcName] = {
                get : Buffer.prototype[funcName],
                len : byteLen
            }
        }
    }
    return out
}
