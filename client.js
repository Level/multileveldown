var levelup = require('levelup')
var duplexify = require('duplexify')
var leveldown = require('./leveldown')

module.exports = function (opts) {
  if (!opts) opts = {}

  var down
  opts.db = createLeveldown
  opts.onflush = onflush
  var db = levelup('multileveldown', opts)
  db.createRpcStream = db.connect = connect

  return db

  function createLeveldown (path) {
    down = leveldown(path, opts)
    return down
  }

  function onflush () {
    db.emit('flush')
  }

  function connect (opts) {
    if (down) return down.createRpcStream(opts, null)

    var proxy = duplexify()
    db.open(function () {
      down.createRpcStream(opts, proxy)
    })

    return proxy
  }
}
