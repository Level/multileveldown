'use strict'

const levelup = require('levelup')
const encode = require('encoding-down')
const leveldown = require('./leveldown')

module.exports = function (opts) {
  if (!opts) opts = {}

  const down = leveldown({ ...opts, onflush })
  const db = levelup(encode(down, opts), opts)

  // TODO: fix in levelup
  db.supports.status = true

  db.createRpcStream = db.connect = connect
  db.isFlushed = isFlushed
  db.forward = forward

  // Workaround for abstract-leveldown tests that expect db._nextTick
  // TODO: fix tests or add _nextTick to levelup for API parity
  if (!db._nextTick) db._nextTick = leveldown.prototype._nextTick

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
