const tape = require('tape')
const memdown = require('memdown')
const levelup = require('levelup')
const multileveldown = require('../')
const encode = require('encoding-down')
const factory = require('level-compose')(memdown, encode, levelup)

tape('retry get', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ retry: true })

  db.put('hello', 'world', function () {
    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      t.end()
    })

    stream.pipe(client.createRpcStream()).pipe(stream)
  })
})

tape('no retry get', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ retry: false })

  client.open(function () {
    db.put('hello', 'world', function () {
      client.get('hello', function (err, value) {
        t.ok(err, 'had error')
        t.end()
      })

      const rpc = client.createRpcStream()
      stream.pipe(rpc).pipe(stream)
      rpc.destroy()

      setTimeout(function () {
        const rpc = client.createRpcStream()
        stream.pipe(rpc).pipe(stream)
      }, 100)
    })
  })
})

tape('retry get', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ retry: true })

  client.open(function () {
    db.put('hello', 'world', function () {
      client.get('hello', function (err, value) {
        t.error(err, 'no err')
        t.same(value, 'world')
        t.end()
      })

      const rpc = client.createRpcStream()
      stream.pipe(rpc).pipe(stream)
      rpc.destroy()

      setTimeout(function () {
        const rpc = client.createRpcStream()
        stream.pipe(rpc).pipe(stream)
      }, 100)
    })
  })
})

tape('retry read stream', function (t) {
  const db = factory()
  const client = multileveldown.client({ retry: true })

  client.open(function () {
    db.batch([{
      type: 'put',
      key: 'hej',
      value: 'verden'
    }, {
      type: 'put',
      key: 'hello',
      value: 'world'
    }, {
      type: 'put',
      key: 'hola',
      value: 'mundo'
    }], function () {
      const rs = client.createReadStream()
      const expected = [{
        key: 'hej',
        value: 'verden'
      }, {
        key: 'hello',
        value: 'world'
      }, {
        key: 'hola',
        value: 'mundo'
      }]

      rs.on('data', function (data) {
        t.same(data, expected.shift(), 'stream continues over retry')
      })

      rs.on('end', function () {
        t.same(expected.length, 0, 'no more data')
        t.end()
      })

      let stream
      let clientStream

      const connect = function () {
        stream = multileveldown.server(db)
        clientStream = client.createRpcStream()

        stream.pipe(clientStream).pipe(stream)
        clientStream.on('close', connect)
      }

      connect()
    })
  })
})

tape('retry read stream and limit', function (t) {
  const db = factory()
  const client = multileveldown.client({ retry: true })

  client.open(function () {
    db.batch([{
      type: 'put',
      key: 'hej',
      value: 'verden'
    }, {
      type: 'put',
      key: 'hello',
      value: 'world'
    }, {
      type: 'put',
      key: 'hola',
      value: 'mundo'
    }], function () {
      const rs = client.createReadStream({ limit: 2 })
      const expected = [{
        key: 'hej',
        value: 'verden'
      }, {
        key: 'hello',
        value: 'world'
      }]

      rs.on('data', function (data) {
        t.same(data, expected.shift(), 'stream continues over retry')
      })

      rs.on('end', function () {
        t.same(expected.length, 0, 'no more data')
        t.end()
      })

      let stream
      let clientStream

      const connect = function () {
        stream = multileveldown.server(db)
        clientStream = client.createRpcStream()

        stream.pipe(clientStream).pipe(stream)
        clientStream.on('close', connect)
      }

      connect()
    })
  })
})
