'use strict'

const path = require('path')


const config = {}

module.exports = function() {
  // Already initialized, don't change
  if ('rootdir' in config) return config

  // Store app root directory
  config.rootdir = __dirname

  // Load custom config.json
  try {
    const cfgJson = require('fs').readFileSync('./data/config.json').toString()
    const cfg = JSON.parse(cfgJson)

    Object.assign(config, cfg)
  }
  catch(e) {
    return config
  }


  return config
}
