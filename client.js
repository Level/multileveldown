const levelup = require('levelup')
const encode = require('encoding-down')
const leveldown = require('./leveldown')

module.exports = function (opts) {
  if (!opts) opts = {}

  const down = leveldown(Object.assign({}, opts, { onflush: onflush }))
  const db = levelup(encode(down, opts), opts)

  db.createRpcStream = db.connect = connect
  db.isFlushed = isFlushed
  db.forward = forward

  return db

  function onflush () {
    db.emit('flush')
  }

  function connect (opts, proxy) {
    return down.createRpcStream(opts, proxy)
  }

  function isFlushed () {
    return down.isFlushed()
  }

  function forward (db) {
    down.forward(db)
  }
}
