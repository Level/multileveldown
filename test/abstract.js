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

require('abstract-leveldown/abstract/chained-batch-test').setUp(factory, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').args(factory, test, testCommon)

require('abstract-leveldown/abstract/close-test').close(factory, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(factory, test, testCommon)

require('abstract-leveldown/abstract/get-test').setUp(factory, test, testCommon)
require('abstract-leveldown/abstract/get-test').args(factory, test, testCommon)

require('abstract-leveldown/abstract/iterator-test').setUp(factory, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').args(factory, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').sequence(factory, test, testCommon)

// require('abstract-leveldown/abstract/leveldown-test').args(factory, test, testCommon)
require('abstract-leveldown/abstract/open-test').args(factory, test, testCommon)

require('abstract-leveldown/abstract/put-get-del-test').setUp(factory, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').errorKeys(factory, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').errorValues(factory, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').tearDown(factory, test, testCommon)

require('abstract-leveldown/abstract/put-test').all(factory, test, testCommon)
