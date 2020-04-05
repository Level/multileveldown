var test = require('tape')
var memdown = require('memdown')
var levelup = require('levelup')
var encode = require('encoding-down')
var factory = require('level-compose')(memdown, encode, levelup)
var multileveldown = require('..')
var suite = require('abstract-leveldown/test')

suite({
  test: test,
  factory: function () {
    var db = factory()
    var stream = multileveldown.server(db)
    var client = multileveldown.client()

    stream.pipe(client.createRpcStream()).pipe(stream)

    // This is a levelup instance, but we're testing it as abstract-leveldown :)
    return client
  },
  seek: false,
  clear: true,
  snapshots: false,
  createIfMissing: false,
  errorIfExists: false,
  bufferKeys: true,
  legacyRange: false,
  promises: true,
  status: false,
  serialize: false,
  encodings: true
})
