var stream = require('stream')
var util = require('util')
var bl = require('bl')

var Parse = module.exports = function (cb, options) {
    if (!(this instanceof Parse)) return new Parse(cb, options)

    if (!options) {
        options = {}
    }
    options.objectMode = options.hasOwnProperty('objectMode')

    stream.Transform.call(this, options)

    this.cb = cb
    this.buffer = new bl()
    this.DEFER = {}
    this.next = cb.apply(this, [undefined])
}

util.inherits(Parse, stream.Transform)

Parse.prototype.defer = function (t) {
    if (this.next !== this.DEFER) {
        throw new Error('refusing to overwrite non-DEFER type')
    }
    this.next = t
    this._rread()
}

Parse.prototype._transform = function _transform (input, encoding, callback) {
    this.buffer.append(input)
    this._rread()
    callback()
}

Parse.prototype._rread = function () {
    var chunk
    var offset = 0

    while (this.next !== undefined && this.next !== this.DEFER &&
           (chunk = this.buffer.slice(offset, offset + this.next.len)).length === this.next.len) {

        offset += chunk.length
        this.next = this.cb.apply(this, [this.next.get.apply(chunk, [0])])
    }

    if (this.next === undefined) {
        this.push(null)
    }

    this.buffer.consume(offset)
}

var Buf = Parse.prototype.Buffer = function (len) {
    if (!(this instanceof Buf)) return new Buf(len)
    this.len = len
    this.get = function () {
        return this
    }
}

var Skip = Parse.prototype.Skip = function (len) {
    if (!(this instanceof Skip)) return new Skip(len)
    this.len = len
    this.get = function () {
        return null
    }
}

var Str = Parse.prototype.String = function (len, encoding) {
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

        Parse.prototype[funcName] = {
            get : Buffer.prototype[funcName],
            len : byteLen
        }
    }
}
