/* <target? compilation:

- Create UUID tempdir
- Symlink platformio.ini (read only)
- Symlink lib folder (read only)
- Create src folder
- Place ino file in src folder
- `platformio run -v --disable-auto-clean --project-dir <dirname>`
- Save compilation messages (stdout/stderr)
- Save generated HEX
*/

// For the Arduboy target this is the equivalent of:
// ../clouduboy-platforms/lib/Arduboy-1.1.1$  ./test.sh _compile.ino &> ~/data/clouduboy-compiler/data/build.log
// (also outputs .pioenvs/leonardo/firmware.hex)

const fs = require('fs-extra')
const path = require('path')

const {
  rootdir,
  DIR_JOBS_READY,
  DIR_JOBS_PENDING,
  QUEUE_LENGTH_HEADER,
} = require(__filename.replace(/\bmodules\b.*/,'config.js'))()

const jobs = require(rootdir+'/modules/lib/jobs')


module.exports = function init(app) {
  app.use('/api/v1/compile', require('express').json(), compileRequest)
}



function compileRequest(req, res) {
  // No source file to convert specified
  if (!req.body.file) return res.status(500).send('"ERROR: Missing file parameter!"')

  const jobid = jobs.create()

  const filepath = path.join(DIR_JOBS_PENDING, jobid, 'src/game.js')
  const metapath = path.join(DIR_JOBS_PENDING, jobid, 'job.json')
  const job = {}

  job.type = 'compile'
  job.target = req.query.target || 'arduboy' //TODO: target selection
  job.id = jobid
  job.started = Date.now()

  fs.outputFile(filepath, req.body.file).then(
    _ => fs.outputJson(metapath, job)
  )

  res.setHeader(QUEUE_LENGTH_HEADER, job.queue||0)
  res.json({ job: jobid })

  console.log('Compiling ', filepath+'…')
}
