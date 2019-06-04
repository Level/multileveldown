var tape = require('tape')
var memdown = require('memdown')
var concat = require('concat-stream')
var levelup = require('levelup')
var encode = require('encoding-down')
var factory = require('level-compose')(memdown, encode, levelup)
var multileveldown = require('../')

tape('get', function (t) {
  t.plan(7)

  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client({ valueEncoding: 'json' })

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

  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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

  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client({ valueEncoding: 'json' })

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

  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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
  var db = factory()

  db.put('hello', 'verden')

  var stream = multileveldown.server(db, { readonly: true })
  var client = multileveldown.client()

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
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], function (err) {
    t.error(err, 'no err')
    var rs = client.createReadStream()
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 2)
      t.same(datas[0], { key: 'hej', value: 'verden' })
      t.same(datas[1], { key: 'hello', value: 'world' })
      t.end()
    }))
  })
})

tape('read stream (gt)', function (t) {
  var db = factory()
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.batch([{ type: 'put', key: 'hello', value: 'world' }, { type: 'put', key: 'hej', value: 'verden' }], function (err) {
    t.error(err, 'no err')
    var rs = client.createReadStream({ gt: 'hej' })
    rs.pipe(concat(function (datas) {
      t.same(datas.length, 1)
      t.same(datas[0], { key: 'hello', value: 'world' })
      t.end()
    }))
  })
})
