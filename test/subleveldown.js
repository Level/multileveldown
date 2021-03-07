const tape = require('tape')
const memdown = require('memdown')
const concat = require('concat-stream')
const levelup = require('levelup')
const encode = require('encoding-down')
const factory = require('level-compose')(memdown, encode, levelup)
const sub = require('subleveldown')
const multileveldown = require('../')

tape('subleveldown on deferred multileveldown client', function (t) {
  t.plan(5)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()
  const sub1 = sub(client, 'test', { valueEncoding: 'json' })
  const sub2 = sub(client, 'test')

  t.is(client.isOpen(), false)
  stream.pipe(client.createRpcStream()).pipe(stream)

  sub1.put('hello', { test: 'world' }, function (err) {
    t.error(err, 'no err')

    sub1.createReadStream().pipe(concat(function (entries) {
      t.same(entries, [{ key: 'hello', value: { test: 'world' } }])
    }))

    sub2.createReadStream().pipe(concat(function (entries) {
      t.same(entries, [{ key: 'hello', value: '{"test":"world"}' }])
    }))

    db.createReadStream().pipe(concat(function (entries) {
      t.same(entries, [{ key: '!test!hello', value: '{"test":"world"}' }])
    }))
  })
})

tape('subleveldown on non-deferred multileveldown client', function (t) {
  t.plan(5)

  const db = factory()
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.once('open', function () {
    t.is(client.isOpen(), true)

    const sub1 = sub(client, 'test', { valueEncoding: 'json' })
    const sub2 = sub(client, 'test')

    sub1.put('hello', { test: 'world' }, function (err) {
      t.error(err, 'no err')

      sub1.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [{ key: 'hello', value: { test: 'world' } }])
      }))

      sub2.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [{ key: 'hello', value: '{"test":"world"}' }])
      }))

      db.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [{ key: '!test!hello', value: '{"test":"world"}' }])
      }))
    })
  })
})

tape('multileveldown server on deferred subleveldown', function (t) {
  t.plan(4)

  const db = factory()
  const sub1 = sub(db, 'test1')
  const sub2 = sub(db, 'test2')
  const stream = multileveldown.server(sub1)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('from', 'client', function (err) {
    t.error(err, 'no err')

    sub2.put('from', 'server', function (err) {
      t.error(err, 'no err')

      client.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [{ key: 'from', value: 'client' }])
      }))

      db.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [
          { key: '!test1!from', value: 'client' },
          { key: '!test2!from', value: 'server' }
        ])
      }))
    })
  })
})

tape('multileveldown server on non-deferred subleveldown', function (t) {
  t.plan(4)

  const db = factory()
  const sub1 = sub(db, 'test1')
  const sub2 = sub(db, 'test2')

  sub1.once('open', function () {
    const stream = multileveldown.server(sub1)
    const client = multileveldown.client()

    stream.pipe(client.createRpcStream()).pipe(stream)

    client.put('from', 'client', function (err) {
      t.error(err, 'no err')

      sub2.put('from', 'server', function (err) {
        t.error(err, 'no err')

        client.createReadStream().pipe(concat(function (entries) {
          t.same(entries, [{ key: 'from', value: 'client' }])
        }))

        db.createReadStream().pipe(concat(function (entries) {
          t.same(entries, [
            { key: '!test1!from', value: 'client' },
            { key: '!test2!from', value: 'server' }
          ])
        }))
      })
    })
  })
})

tape('multileveldown server on nested subleveldown', function (t) {
  t.plan(4)

  const db = factory()
  const sub1 = sub(db, 'test1')
  const sub2 = sub(sub1, 'test2')
  const sub3 = sub(db, 'test3')
  const stream = multileveldown.server(sub2)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('from', 'client', function (err) {
    t.error(err, 'no err')

    sub3.put('from', 'server', function (err) {
      t.error(err, 'no err')

      client.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [{ key: 'from', value: 'client' }])
      }))

      db.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [
          { key: '!test1!!test2!from', value: 'client' },
          { key: '!test3!from', value: 'server' }
        ])
      }))
    })
  })
})
