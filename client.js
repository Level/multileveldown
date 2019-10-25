var levelup = require('levelup')
var encode = require('encoding-down')
var leveldown = require('./leveldown')

module.exports = function (opts) {
  if (!opts) opts = {}

  var down = leveldown(Object.assign({}, opts, { onflush: onflush }))
  var db = levelup(encode(down, opts), opts)

  db.createRpcStream = db.connect = connect
  db.isFlushed = isFlushed
  db.forward = forward

  return db

  function onflush () {
    db.emit('flush')
  }

  function connect (opts) {
    return down.createRpcStream(opts, null)
  }

  function isFlushed () {
    return down.isFlushed()
  }

  function forward (db) {
    down.forward(db)
  }
}
