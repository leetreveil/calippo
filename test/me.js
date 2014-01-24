var loop = require('../index')
var test = require('tape')
var path = require('path')
var fs = require('fs')
var bufferEqual = require('buffer-equal')

var sample = path.join(__dirname, 'test.bin')

test('should return undefined immediately', function (t) {
    loop.parse(fs.createReadStream(sample), function (v) {
        t.equal(v, undefined)
        t.end()
    })
})

test('should be able to read uint16be', function (t) {
    t.plan(1)
    loop.parse(fs.createReadStream(sample), function (v) {
        if (v === undefined) {
            return loop.readUInt16BE
        }
        t.equal(v, 16)
        t.end()
    })
})

test('should be able to read uint16be then uint16le', function (t) {
    t.plan(2)
    var pos = 0;
    loop.parse(fs.createReadStream(sample), function (v) {
        if (v === undefined) {
            return loop.readUInt16BE
        }
        if (pos === 0) {
            t.equal(v, 16)
            pos++;
            return loop.readUInt16LE
        }
        t.equal(v, 16)
        t.end()
    })
})

test('should be able to read raw buffer', function (t) {
    t.plan(1)
    loop.parse(fs.createReadStream(sample), function (v) {
        if (v === undefined) {
            return new loop.Buffer(2)
        }
        t.ok(bufferEqual(v, new Buffer([0x00, 0x10])), 'buffers')
        t.end()
    })
})

test('should be able to skip n bytes', function (t) {
    t.plan(1)
    loop.parse(fs.createReadStream(sample), function (v) {
        if (v === undefined) {
            return new loop.Skip(2, new loop.Buffer(2))
        }
        t.ok(bufferEqual(v, new Buffer([0x10, 0x00])), 'buffers')
        t.end()
    })
})

test('should be able to skip n bytes then read a string', function (t) {
    t.plan(1)
    loop.parse(fs.createReadStream(sample), function (v) {
        if (v === undefined) {
            return new loop.Skip(4, new loop.String(5))
        }
        t.equal(v, 'hello')
        t.end()
    })
})

test('should be able to disengage from stream', function (t) {
    t.plan(1)
    loop.parse(fs.createReadStream(sample), function (v) {
        t.ok(true)
        return loop.DONE
    })
})
