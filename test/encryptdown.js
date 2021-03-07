const tape = require('tape')
const memdown = require('memdown')
const concat = require('concat-stream')
const levelup = require('levelup')
const encode = require('encoding-down')
const encrypt = require('@adorsys/encrypt-down')
const factory = require('level-compose')(memdown, encrypt, encode, levelup)
const multileveldown = require('../')

const jwk = {
  kty: 'oct',
  alg: 'A256GCM',
  use: 'enc',
  k: '123456789abcdefghijklmnopqrstuvwxyz12345678'
}

// The reason we test encrypt-down is that multileveldown should in this case
// peel off the levelup, deferred-leveldown and encoding-down layers from db,
// but stop peeling at the encrypt-down layer. This case is also different
// from subleveldown because encrypt-down doesn't export levelup.
tape('multileveldown server on encrypt-down', function (t) {
  t.plan(3)

  const db = factory({ jwk })
  const stream = multileveldown.server(db)
  const client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('a', 'client', function (err) {
    t.error(err, 'no err')

    db.put('b', 'server', function (err) {
      t.error(err, 'no err')

      client.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [
          { key: 'a', value: 'client' },
          { key: 'b', value: 'server' }
        ])
      }))
    })
  })
})

tape('multileveldown server on encrypt-down with encoding', function (t) {
  t.plan(3)

  const db = factory({ jwk, valueEncoding: 'json' })
  const stream = multileveldown.server(db)
  const client = multileveldown.client({ valueEncoding: 'json' })

  stream.pipe(client.createRpcStream()).pipe(stream)

  client.put('a', { from: 'client' }, function (err) {
    t.error(err, 'no err')

    db.put('b', { from: 'server' }, function (err) {
      t.error(err, 'no err')

      client.createReadStream().pipe(concat(function (entries) {
        t.same(entries, [
          { key: 'a', value: { from: 'client' } },
          { key: 'b', value: { from: 'server' } }
        ])
      }))
    })
  })
})
