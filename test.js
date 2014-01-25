var loop = require('./index')
var test = require('tape')
var bufferEqual = require('buffer-equal')
var streamifier = require('streamifier')

var btos = streamifier.createReadStream

test('should return undefined immediately', function (t) {
    loop.parse(btos(null), function (v) {
        t.equal(v, undefined)
        t.end()
    })
})

test('should be able to read uint16be', function (t) {
    t.plan(1)
    loop.parse(btos(new Buffer([0x00, 0x10])), function (v) {
        if (v === undefined) {
            return loop.readUInt16BE
        }
        t.equal(v, 16)
        t.end()
    })
})

test('should be able to read uint16be then uint16le', function (t) {
    t.plan(2)
    var pos = 0
    loop.parse(btos(new Buffer([0x00, 0x10, 0x10, 0x00])), function (v) {
        if (v === undefined) {
            return loop.readUInt16BE
        }
        if (pos === 0) {
            t.equal(v, 16)
            pos++
            return loop.readUInt16LE
        }
        t.equal(v, 16)
        t.end()
    })
})

test('should be able to read raw buffer', function (t) {
    t.plan(1)
    loop.parse(btos(new Buffer([0x00, 0x10])), function (v) {
        if (v === undefined) {
            return loop.Buffer(2)
        }
        t.ok(bufferEqual(v, new Buffer([0x00, 0x10])), 'buffers')
        t.end()
    })
})

test('should be able to skip n bytes', function (t) {
    t.plan(1)
    loop.parse(btos(new Buffer([0x00, 0x00, 0x10, 0x00])), function (v) {
        if (v === undefined) {
            return loop.Skip(2, loop.Buffer(2))
        }
        t.ok(bufferEqual(v, new Buffer([0x10, 0x00])), 'buffers')
        t.end()
    })
})

test('should be able to skip n bytes then read a string', function (t) {
    t.plan(1)
    loop.parse(btos(new Buffer([0x00, 0x68, 0x69])), function (v) {
        if (v === undefined) {
            return loop.Skip(1, loop.String(2))
        }
        t.equal(v, 'hi')
        t.end()
    })
})

test('should be able to disengage from stream', function (t) {
    t.plan(1)
    loop.parse(btos(null), function (v) {
        t.ok(true, 'disengaged!')
        return loop.DONE
    })
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
        loop.parse(btos(new Buffer(x.bytes)), function (v) {
            if (v !== undefined) {
                t.equal(v, x.expected, funcName)
            }
            return loop[funcName]
        })
    }

    for (var funcName in functions) {
        runParser(funcName)
    }
})
