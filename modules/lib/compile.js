const fs = require('fs-extra')
const path = require('path')

const TASK_NAME = path.basename(__filename, '.js')

const convertTask = require('./convert')

const { rootdir, HOST_URL_READY, CDB_PLATFORMS_DIR } = global.CONFIGURATION

// Exported interface: task.(prepare|execute|cleanup)(job)
module.exports = { prepare, execute, cleanup }



function prepare() {}


function execute(job) {
  // First make sure we convert the file to a compilable format
  if (!job.status) convertTask.execute(job)

  // Wait until conversion finishes
  // TODO: make Job an event emitter, allow to subscribe to updates
  if (job.status !== 'finished-convert') {
    return setTimeout(_ => execute(job), 100)
  }

  // TODO: require from project dependency
  const compile = require(CDB_PLATFORMS_DIR).compile

  // Compile generated Arduino source to target binary
  compile(
    path.join(job.path(), job.target_platform_src), //src
    job.target,
    job.path() //builddir
  )
    .then(compilation => {
      // Write generated target binary to file
      fs.writeFileSync(path.join(job.path(), `src/${job.srcid||"game"}.${job.target}.hex`), compilation.hex)
      // TODO: no sync writes

      job.binary = `${HOST_URL_READY}/${job.id}/src/${job.srcid||"game"}.${job.target}.hex` // TODO: .bin for tiny_arcade

      // Write generated target binary to file
      let { stdout, stderr } = compilation
      fs.writeFileSync(path.join(job.path(), `compiler-log.json`), JSON.stringify({ stdout, stderr }))
      // TODO: no sync writes

      job.compiler_messages = `${HOST_URL_READY}/${job.id}/compiler-log.json`

      // If job was called directly, we are all done, otherwise, continue on to next phase
      job.status = job.type === TASK_NAME ? 'finished' : 'finished-'+TASK_NAME
      return job.update(job)
    })
    .catch(e => job.fail(e))

  // Processing started
  return job.update({ status: 'processing' })
}


function cleanup(job) {

  // Update Job metadata
  return convertTask.cleanup(job)
    .then(job => job.update({
      finished: Date.now(),
    }))

}