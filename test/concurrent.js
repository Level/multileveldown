var tape = require('tape')
var memdown = require('memdown')
var multileveldown = require('..')
var levelup = require('levelup')
var sublevel = require('subleveldown')
var async = require('async')

tape('concurrent read-stream of size 1', function (t) {
  t.plan(2)
  t.timeoutAfter(50000)
  var db = levelup('whatever', { db: memdown })
  var stream = multileveldown.server(db)
  var client = multileveldown.client()
  stream.pipe(client.connect()).pipe(stream)

  var dbs = {}
  var ids = Array.apply(null, new Array(100))
    .map(function () { return process.hrtime().join('-') })

  async.each(ids, function (id, next) {
    var sub = dbs[id] = sublevel(client, id, { valueEncoding: 'json' })

    sub.batch(generateBatch(500), next)

  }, function (err) {
    t.error(err, 'no err')
    stripe(ids, function (err) {
      t.error(err, 'no error striping')
    })
  })

  function stripe (ids, callback) {
    if (!ids.length) { return callback() }

    var newIds = []
    async.each(ids, function (k, next) {
      var sub = dbs[k]
      peek(sub, function (err, data) {
        if (err) { return next(err) }

        if (!data) {
          return next()
        }

        newIds.push(k)
        resilDelete(sub, data.key, function (err) {
          if (err) { return next(err) }
          next()
        })
      })
    }, function (err) {
      if (err) { return callback(err) }

      stripe(newIds, callback)
    })

  }

})

function resilDelete (db, key, cb) {
  db.batch([{ type: 'del', key: key }], function (err) {
    if (err) {
      console.error('Error deleting key %s', key)
      if (!err.notFound) {
        return void setImmediate(resilDelete, db, key, cb)
      }
    }

    cb()
  })
}

function generateBatch (len) {
  return Array.apply(null, new Array(len)).map(function (i) {
    return {
      type: 'put',
      key: process.hrtime().join('-'),
      value: { what: 'fuck' }
    }
  })
}

function peek (d, cb) {
  var data
  var called = false
  d.createReadStream({ limit: 1 }).on('data', function (d) {
    data = d
  }).on('error', function (err) {
    called = true
    cb(err)
  }).on('end', function () {
    if (!called) cb(null, data)
  })
}
