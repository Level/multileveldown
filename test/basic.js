const tape = require('tape')
const memdown = require('memdown')
const concat = require('concat-stream')
const levelup = require('levelup')
const encode = require('encoding-down')
const factory = require('level-compose')(memdown, encode, levelup)
const multileveldown = require('../')

tape('get', function (t) {
  t.plan(7)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  db.put('hello', 'world', function (err) {
    t.error(err, 'no err')

    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
    })

    client.get(Buffer.from('hello'), function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
    })

    client.get('hello', { valueEncoding: 'binary' }, function (err, value) {
      t.error(err, 'no err')
      t.same(value, Buffer.from('world'))
    })
  })
})

tape('get with valueEncoding: json in constructor', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ valueEncoding: 'json' })

  stream.pipe(client.createRpcStream()).pipe(stream)

  db.put('hello', '{"foo":"world"}', function () {
    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, { foo: 'world' })
      t.end()
    })
  })
})

tape('get with valueEncoding: json in get options', function (t) {
  t.plan(5)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  db.put('hello', '{"foo":"world"}', function (err) {
    t.error(err, 'no err')

    client.get('hello', { valueEncoding: 'json' }, function (err, value) {
      t.error(err, 'no err')
      t.same(value, { foo: 'world' })
    })

    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, '{"foo":"world"}')
    })
  })
})

tape('put', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.error(err, 'no err')
    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      t.end()
    })
  })
})

tape('put with valueEncoding: json in constructor', function (t) {
  t.plan(5)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ valueEncoding: 'json' })

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', { foo: 'world' }, function (err) {
    t.error(err, 'no err')

    db.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, '{"foo":"world"}')
    })

    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, { foo: 'world' })
    })
  })
})

tape('put with valueEncoding: json in put options', function (t) {
  t.plan(5)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', { foo: 'world' }, { valueEncoding: 'json' }, function (err) {
    t.error(err, 'no err')

    db.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, '{"foo":"world"}')
    })

    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, '{"foo":"world"}')
    })
  })
})

tape('readonly', function (t) {
  const db = factory()

  db.put('hello', 'verden')

  const stream = multileveldown.server(db, { readonly: true })
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.ok(err, 'put failed')
    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'verden', 'old value')
      t.end()
    })
  })
})

tape('del', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('hello', 'world', function (err) {
    t.error(err, 'no err')
    client.del('hello', function (err) {
      t.error(err, 'no err')
      client.get('hello', function (err) {
        t.ok(err, 'had error')
        t.ok(err.notFound, 'not found err')
        t.end()
      })
    })
  })
})

tape('batch', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], function (err) {
    t.error(err, 'no err')
    client.get('hello', function (err, value) {
      t.error(err, 'no err')
      t.same(value, 'world')
      client.get('hej', function (err, value) {
        t.error(err, 'no err')
        t.same(value, 'verden')
        t.end()
      })
    })
  })
})

tape('read stream', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], function (err) {
    t.error(err, 'no err')
    const rs = client.createReadStream()
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 2)
      t.same(datas[0], { key: 'hej', value: 'verden' })
      t.same(datas[1], { key: 'hello', value: 'world' })
      t.end()
    }))
  })
})

tape('read stream (gt)', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], function (err) {
    t.error(err, 'no err')
    const rs = client.createReadStream({ gt: 'hej' })
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 1)
      t.same(datas[0], { key: 'hello', value: 'world' })
      t.end()
    }))
  })
})

tape('for await...of iterator', function (t) {
  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], async function (err) {
    t.error(err, 'no err')

    const entries = []

    for await (const [key, value] of client.iterator()) {
      entries.push([key, value])
    }

    t.same(entries, [['hej', 'verden'], ['hello', 'world']])
    t.end()
  })
})
