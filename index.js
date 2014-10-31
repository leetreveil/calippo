var stream = require('readable-stream')
var util = require('util')
var bl = require('bl')

var Calippo = module.exports = function (cb, options) {
    if (!(this instanceof Calippo)) return new Calippo(cb, options)

    if (!options) {
        options = {}
    }

    stream.Transform.call(this, options)

    this._cb = cb
    this._buffer = new bl()
    this.DEFER = {}
    this._next = cb.apply(this, [undefined])
}

util.inherits(Calippo, stream.Transform)

Calippo.prototype.defer = function (t) {
    if (this._next !== this.DEFER) {
        throw new Error('refusing to overwrite non-DEFER type')
    }
    this._next = t
    this._rread()
}

Calippo.prototype._transform = function _transform (input, encoding, callback) {
    this._buffer.append(input)
    this._rread()
    callback()
}

Calippo.prototype._rread = function () {
    var chunk
    var offset = 0

    while (this._next !== undefined && this._next !== this.DEFER &&
        (chunk = this._buffer.slice(offset, offset + this._next.len)).length === this._next.len) {

        offset += chunk.length
        this._next = this._cb.apply(this, [this._next.get.apply(chunk, [0])])
    }

    this._buffer.consume(offset)
}

var Buf = Calippo.prototype.Buffer = function (len) {
    if (!(this instanceof Buf)) return new Buf(len)
    this.len = len
    this.get = function () {
        return this
    }
}

var Skip = Calippo.prototype.Skip = function (len) {
    if (!(this instanceof Skip)) return new Skip(len)
    this.len = len
    this.get = function () {
        return null
    }
}

var Str = Calippo.prototype.String = function (len, encoding) {
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

        Calippo.prototype[funcName] = {
            get : Buffer.prototype[funcName],
            len : byteLen
        }
    }
}
