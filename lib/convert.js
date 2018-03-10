const fs = require('fs-extra')
const path = require('path')

const TASK_NAME = path.basename(__filename, '.js')

const { rootdir, HOST_URL_READY, CDB_COMPILER_DIR } = global.CONFIGURATION

// Exported interface: task.(prepare|execute|cleanup)(job)
module.exports = { prepare, execute, cleanup }



function prepare() {}

function execute(job) {
  // TODO: require from project dependency
  const build = require(CDB_COMPILER_DIR)

  // Input source
  job.microcanvas_code = `${HOST_URL_READY}/${job.id}/src/game.js`

  // Read original JS Source and build low-level code using the clouduboy-compiler
  // TODO: other targets than arduboy
  build('arduboy', fs.readFileSync(path.join(job.path(), 'src/game.js')).toString(), job.srcid||"game")
    .then(game => {
      // Write generated target low-level code (*.ino) to file
      fs.writeFileSync(path.join(job.path(), `src/${game.id}.${game.target}.ino`), game.ino||'')
      // TODO: no sync writes

      job.device_code = `${HOST_URL_READY}/${job.id}/src/${game.id}.${game.target}.ino`

      // Strip source code info from the log
      let log = game.compileLog.map(e => Object.assign({}, e, { src: undefined }))
      // Don't show debug messages
      log = log.filter(e => e.lvl !== '')

      // Store the conversion log
      fs.writeFileSync(path.join(job.path(), 'conversion-log.json'), JSON.stringify(log, null, 2))
      // TODO: no sync writes
      // TODO: consider exposing typed source?
      //fs.writeFileSync('data/game.flow.js', game.flow.source||'')

      job.log = `${HOST_URL_READY}/${job.id}/conversion-log.json`

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
  return job.update({
    status: 'ready',
    finished: Date.now(),
  })
}
