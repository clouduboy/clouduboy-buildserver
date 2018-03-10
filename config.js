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

  // Additional global constants
  config.QUEUE_LENGTH_HEADER = 'x-queue-length'

  config.DIR_JOBS_PENDING = path.join(config.rootdir, '/data/jobs/pending')
  config.DIR_JOBS_READY   = path.join(config.rootdir, '/data/jobs/ready')

  config.HOST_URL_READY = config.host_url+config.host_path_ready

  config.CDB_COMPILER_DIR = path.join(config.rootdir, '../clouduboy-compiler')

  return config
}
