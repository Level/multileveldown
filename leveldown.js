'use strict'

const duplexify = require('duplexify')
const { AbstractLevelDOWN, AbstractIterator } = require('abstract-leveldown')
const eos = require('end-of-stream')
const ids = require('numeric-id-map')
const lpstream = require('length-prefixed-stream')
const reachdown = require('reachdown')
const messages = require('./messages')
const matchdown = require('./matchdown')

const ENCODERS = [
  messages.Get,
  messages.Put,
  messages.Delete,
  messages.Batch,
  messages.Iterator,
  messages.Clear,
  messages.GetMany
]

const DECODERS = [
  messages.Callback,
  messages.IteratorData,
  messages.GetManyCallback
]

module.exports = Multilevel

function Multilevel (opts) {
  if (!(this instanceof Multilevel)) return new Multilevel(opts)

  AbstractLevelDOWN.call(this, {
    bufferKeys: true,
    snapshots: !opts.retry,
    permanence: true,
    seek: false,
    clear: true,
    getMany: true,
    createIfMissing: false,
    errorIfExists: false
  })

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

Object.setPrototypeOf(Multilevel.prototype, AbstractLevelDOWN.prototype)

Multilevel.prototype.type = 'multileveldown'

Multilevel.prototype.createRpcStream = function (opts, proxy) {
  if (this._streaming) throw new Error('Only one rpc stream can be active')
  if (!opts) opts = {}
  this._ref = opts.ref || null

  const self = this
  const encode = this._encode
  const decode = lpstream.decode()

  decode.on('data', function (data) {
    if (!data.length) return
    const tag = data[0]
    if (tag >= DECODERS.length) return

    const dec = DECODERS[tag]
    let res
    try {
      res = dec.decode(data, 1)
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

      case 2:
        ongetmanycallback(res)
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

    for (let i = 0; i < self._requests.length; i++) {
      const req = self._requests.get(i)
      if (!req) continue
      self._write(req)
    }

    for (let j = 0; j < self._iterators.length; j++) {
      const ite = self._iterators.get(j)
      if (!ite) continue
      ite.options = ite.iterator._options
      self._write(ite)
    }
  }

  function oniteratordata (res) {
    const req = self._iterators.get(res.id)
    if (!req) return
    req.pending.push(res)
    if (req.callback) req.iterator.next(req.callback)
  }

  function oncallback (res) {
    const req = self._requests.remove(res.id)
    if (req) req.callback(decodeError(res.error), decodeValue(res.value, req.valueAsBuffer))
  }

  function ongetmanycallback (res) {
    const req = self._requests.remove(res.id)
    if (req) req.callback(decodeError(res.error), res.values.map(v => decodeValue(v.value, req.valueAsBuffer)))
  }
}

Multilevel.prototype.forward = function (down) {
  this._db = reachdown(down, matchdown, false)
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
  for (let i = 0; i < this._requests.length; i++) {
    const req = this._requests.remove(i)
    if (req) req.callback(new Error('Connection to leader lost'))
  }

  for (let j = 0; j < this._iterators.length; j++) {
    const ite = this._iterators.remove(j)
    if (ite) {
      if (ite.callback && !closing) ite.callback(new Error('Connection to leader lost'))
      ite.iterator.end()
    }
  }
}

Multilevel.prototype._serializeKey = function (key) {
  return Buffer.isBuffer(key) ? key : Buffer.from(String(key))
}

Multilevel.prototype._serializeValue = function (value) {
  return Buffer.isBuffer(value) ? value : Buffer.from(String(value))
}

Multilevel.prototype._get = function (key, opts, cb) {
  if (this._db) return this._db._get(key, opts, cb)

  const req = {
    tag: 0,
    id: 0,
    key: key,
    valueAsBuffer: opts.asBuffer,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._getMany = function (keys, opts, cb) {
  if (this._db) return this._db._getMany(keys, opts, cb)

  const req = {
    tag: 6,
    id: 0,
    keys: keys,
    valueAsBuffer: opts.asBuffer,
    callback: cb
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._put = function (key, value, opts, cb) {
  if (this._db) return this._db._put(key, value, opts, cb)

  const req = {
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

  const req = {
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

  const req = {
    tag: 3,
    id: 0,
    ops: batch,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._clear = function (opts, cb) {
  if (this._db) return this._db._clear(opts, cb)

  const req = {
    tag: 5,
    id: 0,
    options: opts,
    callback: cb || noop
  }

  req.id = this._requests.add(req)
  this._write(req)
}

Multilevel.prototype._write = function (req) {
  if (this._requests.length + this._iterators.length === 1) ref(this._ref)
  const enc = ENCODERS[req.tag]
  const buf = Buffer.allocUnsafe(enc.encodingLength(req) + 1)
  buf[0] = req.tag
  enc.encode(req, buf, 1)
  this._encode.write(buf)
}

Multilevel.prototype._close = function (cb) {
  if (this._db) return this._db._close(cb)

  this._clearRequests(true)
  if (this._streaming) {
    // _streaming: could be a socket and emit 'close' with a
    // hadError argument.
    this._streaming.once('close', () => cb())
    this._streaming.destroy()
  } else {
    this._nextTick(cb)
  }
}

Multilevel.prototype._iterator = function (opts) {
  if (this._db) return this._db._iterator(opts)
  return new Iterator(this, opts)
}

function noop () {}

function Iterator (db, opts) {
  AbstractIterator.call(this, db)

  this._keyAsBuffer = opts.keyAsBuffer
  this._valueAsBuffer = opts.valueAsBuffer
  this._options = opts

  const req = {
    tag: 4,
    id: 0,
    batch: 32,
    pending: [],
    iterator: this,
    options: opts,
    callback: null
  }

  req.id = this.db._iterators.add(req)

  this._read = 0
  this._ack = Math.floor(req.batch / 2)
  this._req = req
  this.db._write(req)
}

Object.setPrototypeOf(Iterator.prototype, AbstractIterator.prototype)

// TODO: implement _next() instead
Iterator.prototype.next = function (callback) {
  // In callback mode, we return `this`
  let ret = this

  if (callback === undefined) {
    ret = new Promise(function (resolve, reject) {
      callback = function (err, key, value) {
        if (err) reject(err)
        else if (key === undefined && value === undefined) resolve()
        else resolve([key, value])
      }
    })
  }

  this._req.callback = null

  if (this._req.pending.length) {
    this._read++
    if (this._read >= this._ack) {
      this._read = 0
      this._req.options = null
      this.db._write(this._req)
    }

    const next = this._req.pending.shift()

    if (next.error) {
      callback(decodeError(next.error))
      return ret
    }

    if (!next.key && !next.value) {
      callback()
      return ret
    }

    this._options.gt = next.key
    if (this._options.limit > 0) this._options.limit--

    const key = decodeValue(next.key, this._keyAsBuffer)
    const val = decodeValue(next.value, this._valueAsBuffer)

    callback(undefined, key, val)
    return ret
  }

  this._req.callback = callback
  return ret
}

Iterator.prototype._end = function (cb) {
  this._req.batch = 0
  this.db._write(this._req)
  this.db._iterators.remove(this._req.id)
  this.db._flushMaybe()
  this._nextTick(cb)
}

function decodeError (err) {
  return err ? new Error(err) : null
}

function decodeValue (val, asBuffer) {
  if (!val) return undefined
  return asBuffer ? val : val.toString()
}

function ref (r) {
  if (r && r.ref) r.ref()
}

function unref (r) {
  if (r && r.unref) r.unref()
}
