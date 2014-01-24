var assert = require('assert')

// THIS MODULE IS NOW CALLED 'FLOOP' because I like it :)))

exports.parse = function (stream, cb) {
    console.log('in parse for the first time')

    stream.once('readable', function () {
        console.log('in readable')
        var next, poop
        while ( (next = cb(poop)) ) {
            console.log('next: ' + next)
            console.log('poop: ' + poop)

            var chunk = readChunk(stream, next.len)
            console.log(chunk)
            if (!chunk) {
                console.log('break!')
                break
            }

            if (next.get instanceof Function) {
                poop = next.get.apply(chunk, [0])
            } else {
                // console.log('in???')
                // do a second read to get the data we want
                // after skipping
                chunk = readChunk(stream, next.get.len)
                poop = next.get.get.apply(chunk, [0])
            }
        }
    })
}

function readChunk (stream, len) {
    var chunk
    while (null !== (chunk = stream.read(len))) {
        console.log(chunk)
        return chunk
    }
}

var readUInt16BE = exports.readUInt16BE = {
    len : 2,
    get : Buffer.prototype.readUInt16BE
}

var readUInt16LE = exports.readUInt16LE = {
    len : 2,
    get : Buffer.prototype.readUInt16LE
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

var DONE = exports.DONE = null;
