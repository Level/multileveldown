'use strict'

const pbs = require('pbs')
const fs = require('fs')
const path = require('path')

module.exports = pbs(fs.readFileSync(path.join(__dirname, 'schema.proto')))
