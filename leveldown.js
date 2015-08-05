var duplexify = require('duplexify')
var abstract = require('abstract-leveldown')
var util = require('util')
var eos = require('end-of-stream')
var streams = require('./streams')

var noop = function () {}

var decodeError = function (err) {
  return err ? new Error(err) : null
}

var decodeValue = function (val, enc) {
  if (!val) return undefined
  return (enc === 'utf8' || enc === 'utf-8') ? val.toString() : val
}

var ref = function (r) {
  if (r && r.ref) r.ref()
}

var unref = function (r) {
  if (r && r.unref) r.unref()
}

var Multilevel = function (path, opts) {
  if (!(this instanceof Multilevel)) return new Multilevel(path, opts)
  abstract.AbstractLevelDOWN.call(this, path)

  if (!opts) opts = {}

  this._retry = !!opts.retry
  this._requests = []
  this._iterators = []
  this._flush = []
  this._encode = null
  this._ref = null
}

util.inherits(Multilevel, abstract.AbstractLevelDOWN)

var gc = function (list, i) {
  list[i] = null
  while (list.length && !list[list.length - 1]) list.pop()
}

Multilevel.prototype._pbs = function (encode, decode, ref) {
  this._encode = encode
  this._ref = ref

  for (var i = 0; i < this._requests.length; i++) {
    var req = this._requests[i]
    if (!req) continue

    switch (req.method) {
      case 'put':
        encode.puts(req)
        break

      case 'get':
        encode.gets(req)
        break

      case 'del':
        encode.deletes(req)
        break

      case 'batch':
        encode.batches(req)
        break
    }
  }

  for (var j = 0; j < this._iterators.length; j++) {
    var ite = this._iterators[j]
    if (!ite) continue
    ite.options = ite.self._options
    encode.iterators(ite)
  }

  var self = this

  decode.callbacks(function (callback, cb) {
    var req = self._requests[callback.id]
    if (!req) return cb()
    gc(self._requests, callback.id)
    self._flushMaybe()
    req.cb(decodeError(callback.error), decodeValue(callback.value, req.valueEncoding))
    cb()
  })

  decode.iterators(function (ite, cb) {
    var req = self._iterators[ite.id]
    if (!req) return cb()
    req.pending.push(ite)
    if (req.cb) req.self.next(req.cb)
    cb()
  })

  eos(encode, function () {
    self._ref = null
    self._encode = null
    if (self._retry) return
    self._clearRequests(false)
    self._flushMaybe()
  })

  if (this.isFlushed()) unref(this._ref)

  return null
}

Multilevel.prototype._clearRequests = function (closing) {
  for (var i = 0; i < this._requests.length; i++) {
    var req = this._requests[i]
    if (req) req.cb(new Error('Connection to leader lost'))
  }

  for (var j = 0; j < this._iterators.length; j++) {
    var ite = this._iterators[j]
    if (ite) {
      if (ite.cb && !closing) ite.cb(new Error('Connection to leader lost'))
      ite.self.end()
    }
  }

  this._requests = []
  this._iterators = []
}

Multilevel.prototype.createRpcStream = function (opts) {
  if (!opts) opts = {}
  if (opts.encode && opts.decode) return this._pbs(opts.encode, opts.decode, opts.ref || null)
  var encode = streams.Client.encode()
  var decode = streams.Server.decode()
  this._pbs(encode, decode, opts.ref || null)
  return duplexify(decode, encode)
}

Multilevel.prototype.isFlushed = function () {
  return !this._requests.length && !this._iterators.length
}

// to allow someone using multileveldown to detect
// when it is safe to shutdown the pipeline
Multilevel.prototype.flush = function (cb) {
  if (this.isFlushed()) return cb()
  this._flush.push(cb)
}

Multilevel.prototype._flushMaybe = function () {
  if (!this.isFlushed()) return
  while (this._flush.length) this._flush.shift()()
  unref(this._ref)
}

var nextId = function (list, self) {
  var id = list.indexOf(null)
  if (id === -1) id = list.push(null) - 1
  if (id === 0) ref(self._ref)
  return id
}

Multilevel.prototype._put = function (key, value, opts, cb) {
  var id = nextId(this._requests, this)
  var req = {
    method: 'put',
    id: id,
    key: key,
    value: value,
    cb: cb || noop
  }

  this._requests[id] = req
  if (this._encode) if (this._encode) this._encode.puts(req)
}

Multilevel.prototype._get = function (key, opts, cb) {
  var id = nextId(this._requests, this)
  var req = {
    method: 'get',
    id: id,
    key: key,
    valueEncoding: opts.valueEncoding,
    cb: cb || noop
  }

  this._requests[id] = req
  if (this._encode) this._encode.gets(req)
}

Multilevel.prototype._del = function (key, opts, cb) {
  var id = nextId(this._requests, this)
  var req = {
    method: 'del',
    id: id,
    key: key,
    cb: cb || noop
  }

  this._requests[id] = req
  if (this._encode) this._encode.deletes(req)
}

Multilevel.prototype._batch = function (batch, opts, cb) {
  var id = nextId(this._requests, this)
  var req = {
    method: 'batch',
    id: id,
    ops: batch,
    cb: cb || noop
  }

  this._requests[id] = req
  if (this._encode) this._encode.batches(req)
}

Multilevel.prototype._close = function (cb) {
  if (this._encode) this._encode.destroy()
  this._clearRequests(true)
  cb()
}

var Iterator = function (parent, opts) {
  this._id = nextId(parent._iterators, parent)
  this._parent = parent
  this._keyEncoding = opts.keyEncoding
  this._valueEncoding = opts.valueEncoding
  this._options = opts

  var req = {
    id: this._id,
    batch: 32,
    pending: [],
    self: this,
    prev: null,
    options: opts,
    cb: null
  }

  this._read = 0
  this._ack = Math.floor(req.batch / 2)
  this._req = req
  this._parent._iterators[this._id] = req
  if (this._parent._encode) this._parent._encode.iterators(req)
}

Iterator.prototype.next = function (cb) {
  var req = this._req
  req.cb = null

  if (req.pending.length) {
    this._read++
    if (this._read >= this._ack) {
      this._read = 0
      this._req.options = null
      if (this._parent._encode) this._parent._encode.iterators(this._req)
    }

    var next = req.pending.shift()
    if (next.error) return cb(decodeError(next.error))
    if (!next.key && !next.value) return cb()
    this._options.gt = next.key
    if (this._options.limit > 0) this._options.limit--
    return cb(undefined, decodeValue(next.key, this._keyEncoding), decodeValue(next.value, this._valueEncoding))
  }

  req.cb = cb
}

Iterator.prototype.end = function (cb) {
  this._req.batch = 0
  if (this._parent._encode) this._parent._encode.iterators(this._req)
  gc(this._parent._iterators, this._id)
  this._parent._flushMaybe()
  if (cb) process.nextTick(cb)
}

Multilevel.prototype._iterator = function (opts) {
  return new Iterator(this, opts)
}

module.exports = Multilevel
