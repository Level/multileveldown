var duplexify = require('duplexify')
var abstract = require('abstract-leveldown')
var util = require('util')
var eos = require('end-of-stream')
var ids = require('numeric-id-map')
var lpstream = require('length-prefixed-stream')
var messages = require('./messages')

var ENCODERS = [
  messages.Get,
  messages.Put,
  messages.Delete,
  messages.Batch,
  messages.Iterator
]

var DECODERS = [
  messages.Callback,
  messages.IteratorData
]

module.exports = Multilevel

function Multilevel (path, opts) {
  if (!(this instanceof Multilevel)) return new Multilevel(path, opts)
  abstract.AbstractLevelDOWN.call(this, path)

  if (!opts) opts = {}
  this._iterators = ids()
  this._requests = ids()
  this._retry = !!opts.retry
  this._onflush = opts.onflush || noop
  this._encode = lpstream.encode()
  this._streaming = null
  this._ref = null
  this._db = null
}

util.inherits(Multilevel, abstract.AbstractLevelDOWN)

Multilevel.prototype.createRpcStream = function (opts, proxy) {
  if (this._streaming) throw new Error('Only one rpc stream can be active')
  if (!opts) opts = {}
  this._ref = opts.ref || null

  var self = this
  var encode = this._encode
  var decode = lpstream.decode()

  decode.on('data', function (data) {
    if (!data.length) return
    var tag = data[0]
    if (tag >= DECODERS.length) return

    var dec = DECODERS[tag]
    try {
      var res = dec.decode(data, 1)
    } catch (err) {
      return
    }

    switch (tag) {
      case 0:
        oncallback(res)
        break

      case 1:
        oniteratordata(res)
        break
    }

    self._flushMaybe()
  })

  if (!proxy) proxy = duplexify()
  proxy.setWritable(decode)
  proxy.setReadable(encode)
  eos(proxy, cleanup)
  this._streaming = proxy
  return proxy

  function cleanup () {
    self._streaming = null
    self._encode = lpstream.encode()

    if (!self._retry) {
      self._clearRequests(false)
      self._flushMaybe()
      return
    }

    for (var i = 0; i < self._requests.length; i++) {
      var req = self._requests.get(i)
      if (!req) continue
      self._write(req)
    }

    for (var j = 0; j < self._iterators.length; j++) {
      var ite = self._iterators.get(j)
      if (!ite) continue
      ite.options = ite.iterator._options
      self._write(ite)
    }
  }

  function oniteratordata (res) {
    var req = self._iterators.get(res.id)
    if (!req) return
    req.pending.push(res)
    if (req.callback) req.iterator.next(req.callback)
  }

  function oncallback (res) {
    var req = self._requests.remove(res.id)
    if (req) req.callback(decodeError(res.error), decodeValue(res.value, req.valueEncoding))
  }
}

Multilevel.prototype.forward = function (down) {
  this._db = down
}

Multilevel.prototype.isFlushed = function () {
  return !this._requests.length && !this._iterators.length
}

Multilevel.prototype._flushMaybe = function () {
  if (!this.isFlushed()) return
  this._onflush()
  unref(this._ref)
}

Multilevel.prototype._clearRequests = function (closing) {
  for (var i = 0; i < this._requests.length; i++) {
    var req = this._requests.remove(i)
    if (req) req.callback(new Error('Connection to leader lost'))
  }

  for (var j = 0; j < this._iterators.length; j++) {
    var ite = this._iterators.remove(j)
    if (ite) {
      if (ite.callback && !closing) ite.callback(new Error('Connection to leader lost'))
      ite.iterator.end()
    }
  }
}

Multilevel.prototype._get = function (key, opts, cb) {
  if (this._db) return this._db._get(key, opts, cb)

  var req = {
    tag: 0,
    id: 0,
    key: key,
    valueEncoding: opts.valueEncoding || (opts.asBuffer === false ? 'utf-8' : 'binary'),
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._put = function (key, value, opts, cb) {
  if (this._db) return this._db._put(key, value, opts, cb)

  var req = {
    tag: 1,
    id: 0,
    key: key,
    value: value,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._del = function (key, opts, cb) {
  if (this._db) return this._db._del(key, opts, cb)

  var req = {
    tag: 2,
    id: 0,
    key: key,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._batch = function (batch, opts, cb) {
  if (this._db) return this._db._batch(batch, opts, cb)

  var req = {
    tag: 3,
    id: 0,
    ops: batch,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._write = function (req) {
  if (this._requests.length + this._iterators.length === 1) ref(this._ref)
  var enc = ENCODERS[req.tag]
  var buf = new Buffer(enc.encodingLength(req) + 1)
  buf[0] = req.tag
  enc.encode(req, buf, 1)
  this._encode.write(buf)
}

Multilevel.prototype._close = function (cb) {
  if (this._db) return this._db._close(cb)

  this._clearRequests(true)
  if (this._streaming) {
    this._streaming.once('close', cb)
    this._streaming.destroy()
  } else {
    process.nextTick(cb)
  }
}

Multilevel.prototype._iterator = function (opts) {
  if (this._db) return this._db._iterator(opts)
  return new Iterator(this, opts)
}

function noop () {}

function Iterator (parent, opts) {
  this._parent = parent
  this._keyEncoding = opts.keyEncoding
  this._valueEncoding = opts.valueEncoding
  this._options = opts

  var req = {
    tag: 4,
    id: 0,
    batch: 32,
    pending: [],
    iterator: this,
    options: opts,
    callback: null
  }

  req.id = parent._iterators.add(req)

  this._read = 0
  this._ack = Math.floor(req.batch / 2)
  this._req = req
  this._parent._write(req)
}

Iterator.prototype.next = function (cb) {
  this._req.callback = null

  if (this._req.pending.length) {
    this._read++
    if (this._read >= this._ack) {
      this._read = 0
      this._req.options = null
      this._parent._write(this._req)
    }

    var next = this._req.pending.shift()
    if (next.error) return cb(decodeError(next.error))

    if (!next.key && !next.value) return cb()

    this._options.gt = next.key
    if (this._options.limit > 0) this._options.limit--

    var key = decodeValue(next.key, this._keyEncoding)
    var val = decodeValue(next.value, this._valueEncoding)
    return cb(undefined, key, val)
  }

  this._req.callback = cb
}

Iterator.prototype.end = function (cb) {
  this._req.batch = 0
  this._parent._write(this._req)
  this._parent._iterators.remove(this._req.id)
  this._parent._flushMaybe()
  if (cb) process.nextTick(cb)
}

function decodeError (err) {
  return err ? new Error(err) : null
}

function decodeValue (val, enc) {
  if (!val) return undefined
  return (enc === 'utf8' || enc === 'utf-8') ? val.toString() : val
}

function ref (r) {
  if (r && r.ref) r.ref()
}

function unref (r) {
  if (r && r.unref) r.unref()
}
