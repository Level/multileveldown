var pbs = require('pbs')
var fs = require('fs')

module.exports = pbs(fs.readFileSync(__dirname + '/schema.proto'))
