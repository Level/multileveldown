var tape = require('tape')
var memdown = require('memdown')
var concat = require('concat-stream')
var levelup = require('levelup')
var encode = require('encoding-down')
var encrypt = require('@adorsys/encrypt-down')
var factory = require('level-compose')(memdown, encrypt, encode, levelup)
var multileveldown = require('../')

var jwk = {
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

  var db = factory({ jwk })
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

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

  var db = factory({ jwk, valueEncoding: 'json' })
  var stream = multileveldown.server(db)
  var client = multileveldown.client({ valueEncoding: 'json' })

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
