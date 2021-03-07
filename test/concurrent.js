const tape = require('tape')
const memdown = require('memdown')
const levelup = require('levelup')
const concat = require('concat-stream')
const multileveldown = require('../')
const encode = require('encoding-down')
const factory = require('level-compose')(memdown, encode, levelup)

tape('two concurrent iterators', function (t) {
  const db = factory()
  const server = multileveldown.server(db)
  const client = multileveldown.client()

  server.pipe(client.connect()).pipe(server)

  const batch = []
  for (let i = 0; i < 100; i++) batch.push({ type: 'put', key: 'key-' + i, value: 'value-' + i })

  client.batch(batch, function (err) {
    t.error(err)

    const rs1 = client.createReadStream()
    const rs2 = client.createReadStream()

    rs1.pipe(concat(function (list1) {
      t.same(list1.length, 100)
      rs2.pipe(concat(function (list2) {
        t.same(list2.length, 100)
        t.end()
      }))
    }))
  })
})
