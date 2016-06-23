var tape = require('tape')
var memdown = require('memdown')
var levelup = require('levelup')
var concat = require('concat-stream')
var multileveldown = require('../')

tape('two concurrent iterators', function (t) {
  var db = levelup('', {db: memdown})
  var server = multileveldown.server(db)
  var client1 = multileveldown.client()
  var client2 = multileveldown.client()

  server.pipe(client1.connect()).pipe(server)
  server.pipe(client2.connect()).pipe(server)

  var batch = []
  for (var i = 0; i < 100; i++) batch.push({type: 'put', key: 'key-' + i, value: 'value-' + i})

  client1.batch(batch, function (err) {
    t.error(err)

    var rs1 = client1.createReadStream({ gt: 'key-98' })
    var rs2 = client2.createReadStream()

    rs1.pipe(concat(function (list1) {
      t.same(list1.length, 1)
      rs2.pipe(concat(function (list2) {
        t.same(list2.length, 100)
        t.end()
      }))
    }))
  })
})
