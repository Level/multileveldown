# multileveldown

[multilevel](https://github.com/juliangruber/multilevel) implemented using leveldowns with seamless retry support

```
npm install multileveldown
```

[![build status](http://img.shields.io/travis/mafintosh/multileveldown.svg?style=flat)](http://travis-ci.org/mafintosh/multileveldown)

## Usage

Similar to [multilevel](https://github.com/juliangruber/multilevel) you can use this to share a levelup across multiple processes
over a stream. In addition multileveldown supports seamless retry so you can reconnect
to a server without your read streams / puts failing etc.

First create a server

``` js
var multileveldown = require('multileveldown')
var level = require('level')
var net = require('net')

var db = level('db')

var server = net.createServer(function (sock) {
  sock.on('error', function () {
    sock.destroy()
  })

  sock.pipe(multileveldown.server(db)).pipe(sock)
})

server.listen(9000)
```

Then create some clients

``` js
var multileveldown = require('multileveldown')
var net = require('net')

var db = multileveldown.client()

var sock = net.connect(9000)
sock.pipe(db.connect()).pipe(sock)

db.put('hello', 'world', function () {
  db.get('hello', console.log)
})
```

## Reconnect

To setup reconnect in your client simply set `retry: true` and reconnect to your server when the connection fails

``` js
var multileveldown = require('multileveldown')
var net = require('net')

var db = multileveldown.client({
  retry: true
})

var connect = function () {
  var sock = net.connect(9000)
  var remote = db.connect()

  sock.on('error', function () {
    sock.destroy()
  })

  sock.on('close', function () {
    remote.destroy()
    setTimeout(connect, 1000) // reconnect after 1s
  })

  sock.pipe(remote).pipe(sock)
}

connect()
```

multileveldown will now make sure to retry your pending operations when you reconnect. If you create a read stream
and your connection fails half way through reading that stream multileveldown makes sure to only retry the part of the
stream you are missing. Please note that this might not guarantee leveldb snapshotting if you rely on that.

## API

#### `multileveldown.server(db, [options])`

Returns a new duplex server stream that you should connect with a client. Options include

``` js
{
  readonly: true, // make the database be accessible as read only
  preput: function (key, val, cb) {}, // called before puts
  predel: function (key, cb) {}, // called before dels
  prebatch: function (batch, cb) {} // called before batches
}
```

#### `clientDb = multileveldown.client([options])`

Creates a new client levelup that you can connect to a server.
Options are forwarded to the levelup constructor.

#### `clientDb.connect()`

Returns a new duplex client stream that you should connect with a server stream

#### `clientDb.createRpcStream()`

Just an alias to `.connect` for [multilevel](https://github.com/juliangruber/multilevel) API compatibility.

## License

MIT
