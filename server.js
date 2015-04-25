var duplexify = require('duplexify')
var eos = require('end-of-stream')
var streams = require('./streams')

var noop = function () {}

var pbs = function (down, encode, decode) {
  var iterators = []

  decode.puts(function (req, cb) {
    down.put(req.key, req.value, function (err) {
      encode.callbacks({id: req.id, error: err && err.message}, cb)
    })
  })

  decode.gets(function (req, cb) {
    down.get(req.key, {valueEncoding: 'binary'}, function (err, value) {
      encode.callbacks({id: req.id, error: err && err.message, value: value}, cb)
    })
  })

  decode.deletes(function (req, cb) {
    down.del(req.key, function (err) {
      encode.callbacks({id: req.id, error: err && err.message}, cb)
    })
  })

  decode.batches(function (req, cb) {
    down.batch(req.ops, function (err) {
      encode.callbacks({id: req.id, error: err && err.message}, cb)
    })
  })

  decode.iterators(function (req, cb) {
    while (iterators.length < req.id) iterators.push(null)

    var prev = iterators[req.id]

    if (prev) {
      if (!req.batch) {
        prev.end()
      } else {
        prev.batch = req.batch
        prev.next()
      }
      return cb()
    }

    var first = true
    var nexting = false
    var ended = false
    var iterator = down.iterator(req.options)

    var end = function () {
      ended = true
      iterators[req.id] = null
      while (iterators.length && iterators[iterators.length - 1]) iterators.pop()
      iterator.end(noop)
    }

    var next = function () {
      if (nexting || ended) return
      if (!first && (!data.batch || data.error || (!data.key && !data.value))) return
      first = false
      nexting = true
      iterator.next(function (err, key, value) {
        nexting = false
        data.error = err && err.message
        data.key = key
        data.value = value
        data.batch--
        encode.iterators(data, next)
      })
    }

    var data = iterators[req.id] = {
      id: req.id,
      batch: req.batch,
      key: null,
      value: null,
      next: next,
      end: end
    }

    next()
    cb()
  })

  eos(decode, function () {
    for (var i = 0; i < iterators.length; i++) {
      if (!iterators[i]) continue
      iterators[i].end()
    }
  })

  return null
}

module.exports = function (db, opts) {
  if (opts && opts.encode && opts.decode) {
    if (!db.isOpen()) throw new Error('db must be open to use raw encode/decode mode')
    return pbs(db.db, opts.encode, opts.decode)
  }

  var encode = streams.Server.encode()
  var decode = streams.Client.decode()

  if (db.isOpen()) {
    pbs(db.db, encode, decode)
    return duplexify(decode, encode)
  }

  var stream = duplexify()

  db.open(function () {
    pbs(db.db, encode, decode)
    stream.setWritable(decode)
    stream.setReadable(encode)
  })

  return stream
}
