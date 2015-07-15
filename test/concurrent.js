var tape = require('tape')
var net = require('net')
var memdown = require('memdown')
var sublevel = require('subleveldown')
var level = require('level-hyper')
var levelup = require('levelup')
var each = require('each-limit')
var concat = require('concat-stream')
var faker = require('faker')
var rimraf = require('rimraf')
var multileveldown = require('../')

tape('two concurrent iterators', function (t) {
  var db = levelup('', {db: memdown})
  var server = multileveldown.server(db)
  var client = multileveldown.client()

  server.pipe(client.connect()).pipe(server)

  var batch = []
  for (var i = 0; i < 100; i++) batch.push({type: 'put', key: 'key-' + i, value: 'value-' + i})

  client.batch(batch, function (err) {
    t.error(err)

    var rs1 = client.createReadStream()
    var rs2 = client.createReadStream()

    rs1.pipe(concat(function (list1) {
      t.same(list1.length, 100)
      rs2.pipe(concat(function (list2) {
        t.same(list2.length, 100)
        t.end()
      }))
    }))
  })
})

tape('high concurrency and volume case over real server storing on disk', function (t) {
  var loc = __dirname + '/whatever.db'
  var db = level(loc)
  var called = 0
  var width = 100
  var depth = 50
  var total = width
  var ids = generateIds(width)
  var sublevels = {}

  var server = net.createServer(function (sock) {
    sock.on('error', function () {
      sock.destroy()
    })

    sock.pipe(multileveldown.server(db)).pipe(sock)
  })

  server.listen(9000, function () {
    var done = function () {
      if (++called === total) {
        sock1.destroy()
        sock2.destroy()
        server.close()
        rimraf(loc, function () {
          t.end()
        })
      }
    }
    var client1 = multileveldown.client()
    var client2 = multileveldown.client()

    var sock1 = net.connect(9000)
    var sock2 = net.connect(9000)

    sock1.pipe(client1.connect()).pipe(sock1)
    sock2.pipe(client2.connect()).pipe(sock2)

    function load (client, cb) {
      each(ids,
        Number.MAX_VALUE,
        function (id, next) {
          var sub = sublevel(client, id, { valueEncoding: 'json' })
          sub.batch(generateBatch(id, depth), next)
        }, cb
      )
    }

    function iterate (client) {
      each(ids,
        Number.MAX_VALUE,
        function (id, next) {
          var d = sublevels[id] = (sublevels[id] || sublevel(client, id, { valueEncoding: 'json' }))
          peek(d, function (err, data) {
            if (err) return t.error(err)

            if (!data) {
              next()
              // Mark as done since we exhausted depth
              done()
              return
            }
            d.del(data.key, function (err) {
              if (err) return t.error(err)
              next()
            })
          })
        }, function () {
          iterate()
        }
      )
    }

    load(client1, function (err) {
      t.error(err)
      //
      // Have each client read half
      //
      iterate(client2)
    })
  })
})

function peek (db, cb) {
  var data
  var done = false
  var fn = function () {
    if (done) return
    done = true
    cb.apply(null, arguments)
  }

  db.createReadStream({ limit: 1 }).on('data', function (d) {
    data = d
  }).on('error', fn).on('end', function () {
    fn(null, data)
  })
}

function generateIds (len) {
  return Array.apply(null, new Array(len))
    .map(function () {
      return process.hrtime().join('-')
    })
}

function generateBatch (id, len) {
  return Array.apply(null, new Array(len))
    .map(function () {
      return {
        type: 'put',
        key: [id, process.hrtime().join('-')].join('-'),
        value: Array.apply(null, new Array(len)).reduce(function (acc, _, i) {
          acc['key' + i] = faker.lorem.paragraphs()
          return acc
        }, {})
      }
    })
}

