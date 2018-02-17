'use strict'

module.exports = function() {
  let config = { rootdir: __dirname }

  try {
    const cfgJson = require('fs').readFileSync('./data/config.json').toString()
    const cfg = JSON.parse(cfgJson)

    return Object.assign(config, cfg)
  }
  catch(e) {
    return config
  }
}
