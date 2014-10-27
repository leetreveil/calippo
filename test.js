var Squirt = require('./index')
var test = require('tape')
var bufferEqual = require('buffer-equal')
var streamifier = require('streamifier')

var btos = streamifier.createReadStream

test('should return undefined immediately', function (t) {
    t.plan(1)
    btos(new Buffer([0x00, 0x10])).pipe(Squirt(function (v) {
        t.equal(v, undefined)
        t.end()
    }))
})

test('should be able to read uint16be', function (t) {
    t.plan(1)
    btos(new Buffer([0x00, 0x10])).pipe(Squirt(function (v) {
        if (v === undefined) {
            return this.readUInt16BE
        }
        t.equal(v, 16)
        t.end()
    }))
})

test('should be able to read uint16be then uint16le', function (t) {
    t.plan(2)
    var pos = 0
    btos(new Buffer([0x00, 0x10, 0x10, 0x00])).pipe(Squirt(function (v) {
        if (v === undefined) {
            return this.readUInt16BE
        }
        if (pos === 0) {
            t.equal(v, 16)
            pos++
            return this.readUInt16LE
        }
        t.equal(v, 16)
        t.end()
    }))
})

test('should be able to read raw buffer', function (t) {
    t.plan(1)
    btos(new Buffer([0x00, 0x10])).pipe(Squirt(function (v) {
        console.log(this)
        if (v === undefined) {
            return this.Buffer(2)
        }
        t.ok(bufferEqual(v, new Buffer([0x00, 0x10])), 'buffers')
        t.end()
    }))
})

test('should be able to skip n bytes', function (t) {
    t.plan(1)
    var pos = 0
    btos(new Buffer([0x00, 0x00, 0x10, 0x00])).pipe(Squirt(function (v) {
        if (v === undefined) {
            return this.Skip(2)
        }
        if (pos === 0) {
            pos++
            return this.Buffer(2)
        }
        t.ok(bufferEqual(v, new Buffer([0x10, 0x00])), 'buffers')
        t.end()
    }))
})

test('should be able to defer the type callback', function (t) {
    t.plan(1)
    btos(new Buffer([0x00, 0x68, 0x00, 0x68])).pipe(Squirt(function (v) {
        console.log('v: ', v)
        if (v === undefined) {
            var self = this
            process.nextTick(function () {
                self.defer(self.Buffer(2))
            })
            // console.log(this)
            console.log('def:', this.DEFER)
            return this.DEFER
        }
        t.ok(bufferEqual(v, new Buffer([0x00, 0x68])), 'buffers')
        t.end()
    }))
})

test('should raise done event when parser returns undefined', function (t) {
    btos(new Buffer([0x00])).pipe(Squirt(function () {
        return undefined
    }))
    .on('end', function () { t.end() })
    // attach a readable, end will never be fired otherwise
    .on('readable', function () {})
})

test('should be able to use all the standard node Buffer.readXXX methods', function (t) {
    var functions = {
        'readUInt8': { expected: 255, bytes : [0xFF] },
        'readUInt16LE': { expected: 256, bytes : [0x00, 0x01] },
        'readUInt16BE': { expected: 1, bytes : [0x00, 0x01] },
        'readUInt32LE': { expected: 1, bytes : [0x01, 0x00, 0x00, 0x00] },
        'readUInt32BE': { expected: 1, bytes : [0x00, 0x00, 0x00, 0x01] },
        'readInt8': { expected: -1, bytes : [0xFF] },
        'readInt16LE': { expected: 255, bytes : [0xFF, 0x00] },
        'readInt16BE': { expected: 255, bytes : [0x00, 0xFF] },
        'readInt32LE': { expected: 255, bytes : [0xFF, 0x00, 0x00, 0x00] },
        'readInt32BE': { expected: 255, bytes : [0x00, 0x00, 0x00, 0xFF] },
        'readFloatLE': { expected: 1, bytes : [0x00, 0x00, 0x80, 0x3f] },
        'readFloatBE': { expected: 1, bytes : [0x3f, 0x80, 0x00, 0x00] },
        'readDoubleLE': { expected: 0.3333333333333333,
            bytes : [0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0xd5, 0x3f] },
        'readDoubleBE': { expected: 0.3333333333333333,
            bytes : [0x3f, 0xd5, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55] }
    }

    t.plan(Object.keys(functions).length)

    var runParser = function (funcName) {
        var x = functions[funcName]
        btos(new Buffer(x.bytes)).pipe(Squirt(function (v) {
            if (v !== undefined) {
                t.equal(v, x.expected, funcName)
            }
            return this[funcName]
        }))
    }

    for (var funcName in functions) {
        runParser(funcName)
    }
})
