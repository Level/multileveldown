var levelup = require('levelup')
var duplexify = require('duplexify')
var leveldown = require('./leveldown')

module.exports = function (opts) {
  if (!opts) opts = {}

  var down
  opts.db = function (path) {
    down = leveldown(path, opts)
    return down
  }

  var db = levelup('no-location', opts)

  db.createRpcStream =
  db.connect = function (opts) {
    if (opts && opts.encode && opts.decode && !down) throw new Error('db must be open to use raw encode/decode mode')
    if (down) return down.createRpcStream(opts)

    var proxy = duplexify()
    db.open(function () {
      var stream = down.createRpcStream(opts)
      proxy.setWritable(stream)
      proxy.setReadable(stream)
    })

    return proxy
  }

  return db
}
