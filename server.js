'use strict'

const lpstream = require('length-prefixed-stream')
const eos = require('end-of-stream')
const duplexify = require('duplexify')
const reachdown = require('reachdown')
const messages = require('./messages')
const matchdown = require('./matchdown')

const rangeOptions = ['gt', 'gte', 'lt', 'lte']
const noop = () => {}

const DECODERS = [
  messages.Get,
  messages.Put,
  messages.Delete,
  messages.Batch,
  messages.Iterator,
  messages.Clear,
  messages.GetMany
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

  if (db.isOpen && db.isOpen()) ready()
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
          case 5: return onreadonly(req)
          case 6: return ongetmany(req)
        }
      } else {
        switch (tag) {
          case 0: return onget(req)
          case 1: return onput(req)
          case 2: return ondel(req)
          case 3: return onbatch(req)
          case 4: return oniterator(req)
          case 5: return onclear(req)
          case 6: return ongetmany(req)
        }
      }
    })

    function callback (id, err, value) {
      const msg = { id, error: err && err.message, value }
      const buf = Buffer.allocUnsafe(messages.Callback.encodingLength(msg) + 1)
      buf[0] = 0 // Tag
      messages.Callback.encode(msg, buf, 1)
      encode.write(buf)
    }

    function getManyCallback (id, err, values) {
      const msg = { id, error: err && err.message, values }
      const buf = Buffer.allocUnsafe(messages.GetManyCallback.encodingLength(msg) + 1)
      buf[0] = 2 // Tag
      messages.GetManyCallback.encode(msg, buf, 1)
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
      down.get(req.key, { asBuffer: true }, function (err, value) {
        callback(req.id, err, value)
      })
    }

    function ongetmany (req) {
      down.getMany(req.keys, { asBuffer: true }, function (err, values) {
        getManyCallback(req.id, err, values.map(value => ({ value })))
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

    function onclear (req) {
      down.clear(cleanRangeOptions(req.options), function (err) {
        callback(req.id, err)
      })
    }
  }
}

function Iterator (down, req, encode) {
  this.batch = req.batch || 0
  this._iterator = down.iterator(cleanRangeOptions(req.options))
  this._encode = encode
  this._send = (err, key, value) => {
    this._nexting = false
    this._data.error = err && err.message
    this._data.key = key
    this._data.value = value
    this.batch--
    const buf = Buffer.allocUnsafe(messages.IteratorData.encodingLength(this._data) + 1)
    buf[0] = 1
    messages.IteratorData.encode(this._data, buf, 1)
    encode.write(buf)
    this.next()
  }
  this._nexting = false
  this._first = true
  this._ended = false
  this._data = {
    id: req.id,
    error: null,
    key: null,
    value: null
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
  if (this._ended) return
  this._ended = true
  this._iterator.end(noop)
}

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
  return rangeOptions.includes(k)
}
