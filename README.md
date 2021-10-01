# multileveldown

> [`multilevel`](https://github.com/juliangruber/multilevel) implemented using leveldowns with seamless retry support

[![level badge][level-badge]](https://github.com/Level/awesome)
[![npm](https://img.shields.io/npm/v/multileveldown.svg)](https://www.npmjs.com/package/multileveldown)
[![Node version](https://img.shields.io/node/v/multileveldown.svg)](https://www.npmjs.com/package/multileveldown)
[![Test](https://img.shields.io/github/workflow/status/Level/multileveldown/Test?label=test)](https://github.com/Level/multileveldown/actions/workflows/test.yml)
[![Coverage](https://img.shields.io/codecov/c/github/Level/multileveldown?label=&logo=codecov&logoColor=fff)](https://codecov.io/gh/Level/multileveldown)
[![Standard](https://img.shields.io/badge/standard-informational?logo=javascript&logoColor=fff)](https://standardjs.com)
[![Common Changelog](https://common-changelog.org/badge.svg)](https://common-changelog.org)
[![Donate](https://img.shields.io/badge/donate-orange?logo=open-collective&logoColor=fff)](https://opencollective.com/level)

## Usage

Similar to [`multilevel`](https://github.com/juliangruber/multilevel) you can use this to share a `levelup` database across multiple processes over a stream. In addition `multileveldown` supports seamless retry so you can reconnect to a server without your read streams / puts failing etc.

First create a server:

```js
const multileveldown = require('multileveldown')
const level = require('level')
const net = require('net')

const db = level('db')

const server = net.createServer(function (sock) {
  sock.on('error', function () {
    sock.destroy()
  })

  sock.pipe(multileveldown.server(db)).pipe(sock)
})

server.listen(9000)
```

Then create some clients:

```js
const multileveldown = require('multileveldown')
const net = require('net')

const db = multileveldown.client()

const sock = net.connect(9000)
sock.pipe(db.connect()).pipe(sock)

db.put('hello', 'world', function () {
  db.get('hello', console.log)
})
```

## Reconnect

To setup reconnect in your client simply set `retry: true` and reconnect to your server when the connection fails:

```js
const multileveldown = require('multileveldown')
const net = require('net')

const db = multileveldown.client({
  retry: true
})

const connect = function () {
  const sock = net.connect(9000)
  const remote = db.connect()

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

`multileveldown` will now make sure to retry your pending operations when you reconnect. If you create a read stream
and your connection fails half way through reading that stream `multileveldown` makes sure to only retry the part of the
stream you are missing. Please note that this might not guarantee leveldb snapshotting if you rely on that.

## API

#### `multileveldown.server(db, [options])`

Returns a new duplex server stream that you should connect with a client. Options include:

```js
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

Just an alias to `.connect` for [`multilevel`](https://github.com/juliangruber/multilevel) API compatibility.

## Install

With [npm](https://npmjs.org) do:

```
npm i multileveldown
```

## Contributing

[`Level/multileveldown`](https://github.com/Level/multileveldown) is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.

See the [Contribution Guide](https://github.com/Level/community/blob/master/CONTRIBUTING.md) for more details.

## Donate

Support us with a monthly donation on [Open Collective](https://opencollective.com/level) and help us continue our work.

## License

[MIT](LICENSE)

[level-badge]: https://leveljs.org/img/badge.svg
