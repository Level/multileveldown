var test = require('tape')
var memdown = require('memdown')
var levelup = require('levelup')
var multileveldown = require('../')
var testCommon = require('abstract-leveldown/testCommon')

function factory () {
  var db = levelup('no-location', {db: memdown})
  var stream = multileveldown.server(db)
  var client = multileveldown.client()

  stream.pipe(client.createRpcStream()).pipe(stream)
  return client.db
}

require('abstract-leveldown/abstract/batch-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(factory, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/leveldown-test').args(factory, test, testCommon)
require('abstract-leveldown/abstract/open-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(factory, test, testCommon)
require('abstract-leveldown/abstract/ranges-test').all(factory, test, testCommon)
