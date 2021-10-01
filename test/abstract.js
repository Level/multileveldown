const test = require('tape')
const memdown = require('memdown')
const levelup = require('levelup')
const encode = require('encoding-down')
const factory = require('level-compose')(memdown, encode, levelup)
const multileveldown = require('..')
const suite = require('abstract-leveldown/test')

suite({
  test: test,
  factory: function () {
    const db = factory()
    const stream = multileveldown.server(db)
    const client = multileveldown.client()

    stream.pipe(client.createRpcStream()).pipe(stream)

    // This is a levelup instance, but we're testing it as abstract-leveldown :)
    return client
  },
  seek: false,
  clear: true,
  getMany: true,
  snapshots: false,
  createIfMissing: false,
  errorIfExists: false,
  bufferKeys: true,
  promises: true,
  status: true,
  deferredOpen: true,
  serialize: false,
  encodings: true
})
