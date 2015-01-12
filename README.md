Calippo
=======

Binary stream parser for [node](http://nodejs.org)

Callipo is a more modern implementation of an existing binary stream parser for node called [node-strtok](https://github.com/pgriess/node-strtok). The biggest difference is that with node 0.10 we can leverage the more modern [Streams2](http://nodejs.org/api/stream.html#stream_readable_read_size) API which provides us with out of the box methods for consuming and transforming streams of binary data.

Calippo is *not* intended to be a high level DSL for parsing binary streams ala [node-binary](https://github.com/substack/node-binary), this sits lower in the stack, capable of implementing more novel abstractions on top of callipo.

Installation
----
Install via [npm](http://npmjs.org/):
```
npm install calippo
```

Usage
----
Pulls out the data in an int32 prefixed message stream: [int32][data][int32][data]...

```javascript
var Calippo = require('calippo')

var pos

var parser = Calippo(function (value) {
  if (value === undefined) {
    pos = 0
    return this.readUInt32LE
  }
  if (pos === 0) {
    pos = 1
    return this.Buffer(value)
  }
  if (pos === 1) {
    this.push(value)
    pos = 0
    return this.readUInt32LE
  }
})

parser.on('readable', function () {
  while (console.log(parser.read())) {}
})

somestream.pipe(parser)
```

API
----

`Calippo(options, callback)`

`options` is an object passed down into the node [Transform](http://nodejs.org/api/stream.html#stream_new_stream_transform_options) api, pass `{objectMode: true}` if you want to output non binary data with `this.push()`

`callback` takes a single argument, the value just read from the stream, and is expected to return the type of value to read next, e.g. `this.Buffer(len)`. It is this callback that ultimately implements the application protocol, you are expected to manage state yourself.

All expected values are returned from the `callback`, and and the types of values available are all attached to the `this` scope within the callback:

`this.Buffer(len)`

`this.String(len, encoding)`

`this.Skip(len)` - skip (len) bytes, calls callback with `null`

Calippo also implements all the standard node buffer readXXX methods for parsing numbers, see http://nodejs.org/api/buffer.html

`this.readUInt32LE`

`this.readUInt8`

...

We also implement one special type, `DEFER` and one method `defer`. These are used together for when you don't yet know what type of value you want to read next, perhaps you need to wait on some network event:

```javascript
var parser = Calippo(function (value) {
  if (value === undefined) {
    var self = this
    makeSomeWebRequest(function () {
      self.defer(self.Buffer(2))
    })
    return this.DEFER
  }
})
```
`this.defer` takes one argument, the next expected type, you must return `this.DEFER` *before* your callback is called.

Licence
----
MIT
