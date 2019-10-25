var pbs = require('pbs')
var fs = require('fs')
var path = require('path')

module.exports = pbs(fs.readFileSync(path.join(__dirname, 'schema.proto')))
