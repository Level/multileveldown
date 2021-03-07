const lpstream = require('length-prefixed-stream')
const eos = require('end-of-stream')
const duplexify = require('duplexify')
const reachdown = require('reachdown')
const messages = require('./messages')
const rangeOptions = 'gt gte lt lte'.split(' ')
const matchdown = require('./matchdown')

const DECODERS = [
  messages.Get,
  messages.Put,
  messages.Delete,
  messages.Batch,
  messages.Iterator
]

module.exports = function (db, opts) {
  if (!opts) opts = {}

  const readonly = !!(opts.readonly)
  const decode = lpstream.decode()
  const encode = lpstream.encode()
  const stream = duplexify(decode, encode)

  const preput = opts.preput || function (key, val, cb) { cb(null) }
  const predel = opts.predel || function (key, cb) { cb(null) }
  const prebatch = opts.prebatch || function (ops, cb) { cb(null) }

  if (db.isOpen()) ready()
  else db.open(ready)

  return stream

  function ready () {
    const down = reachdown(db, matchdown, false)
    const iterators = []

    eos(stream, function () {
      while (iterators.length) {
        const next = iterators.shift()
        if (next) next.end()
      }
    })

    decode.on('data', function (data) {
      if (!data.length) return
      const tag = data[0]
      if (tag >= DECODERS.length) return

      const dec = DECODERS[tag]
      let req
      try {
        req = dec.decode(data, 1)
      } catch (err) {
        return
      }

      if (readonly) {
        switch (tag) {
          case 0: return onget(req)
          case 1: return onreadonly(req)
          case 2: return onreadonly(req)
          case 3: return onreadonly(req)
          case 4: return oniterator(req)
        }
      } else {
        switch (tag) {
          case 0: return onget(req)
          case 1: return onput(req)
          case 2: return ondel(req)
          case 3: return onbatch(req)
          case 4: return oniterator(req)
        }
      }
    })

    function callback (id, err, value) {
      const msg = { id: id, error: err && err.message, value: value }
      const buf = Buffer.allocUnsafe(messages.Callback.encodingLength(msg) + 1)
      buf[0] = 0
      messages.Callback.encode(msg, buf, 1)
      encode.write(buf)
    }

    function onput (req) {
      preput(req.key, req.value, function (err) {
        if (err) return callback(err)
        down.put(req.key, req.value, function (err) {
          callback(req.id, err, null)
        })
      })
    }

    function onget (req) {
      down.get(req.key, function (err, value) {
        callback(req.id, err, value)
      })
    }

    function ondel (req) {
      predel(req.key, function (err) {
        if (err) return callback(err)
        down.del(req.key, function (err) {
          callback(req.id, err)
        })
      })
    }

    function onreadonly (req) {
      callback(req.id, new Error('Database is readonly'))
    }

    function onbatch (req) {
      prebatch(req.ops, function (err) {
        if (err) return callback(err)

        down.batch(req.ops, function (err) {
          callback(req.id, err)
        })
      })
    }

    function oniterator (req) {
      while (iterators.length < req.id) iterators.push(null)

      let prev = iterators[req.id]
      if (!prev) prev = iterators[req.id] = new Iterator(down, req, encode)

      if (!req.batch) {
        iterators[req.id] = null
        prev.end()
      } else {
        prev.batch = req.batch
        prev.next()
      }
    }
  }
}

function Iterator (down, req, encode) {
  const self = this

  this.batch = req.batch || 0
  this._iterator = down.iterator(cleanRangeOptions(req.options))
  this._encode = encode
  this._send = send
  this._nexting = false
  this._first = true
  this._ended = false
  this._data = {
    id: req.id,
    error: null,
    key: null,
    value: null
  }

  function send (err, key, value) {
    self._nexting = false
    self._data.error = err && err.message
    self._data.key = key
    self._data.value = value
    self.batch--
    const buf = Buffer.allocUnsafe(messages.IteratorData.encodingLength(self._data) + 1)
    buf[0] = 1
    messages.IteratorData.encode(self._data, buf, 1)
    encode.write(buf)
    self.next()
  }
}

Iterator.prototype.next = function () {
  if (this._nexting || this._ended) return
  if (!this._first && (!this.batch || this._data.error || (!this._data.key && !this._data.value))) return
  this._first = false
  this._nexting = true
  this._iterator.next(this._send)
}

Iterator.prototype.end = function () {
  this._ended = true
  this._iterator.end(noop)
}

function noop () {}

function cleanRangeOptions (options) {
  if (!options) return

  const result = {}

  for (const k in options) {
    if (!hasOwnProperty.call(options, k)) continue

    if (!isRangeOption(k) || options[k] != null) {
      result[k] = options[k]
    }
  }

  return result
}

function isRangeOption (k) {
  return rangeOptions.indexOf(k) !== -1
}
