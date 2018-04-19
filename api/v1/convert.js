/* <target> conversion:

- build.js should sort this out
- a temp file is generated but with uuid, parallel compilations shouldn't affect each other
*/

// Basically:
// ../clouduboy-compiler$  node build.js $1 > data/compile.log
// (also outputs data/game.ino)

const fs = require('fs-extra')
const path = require('path')

const { rootdir, DIR_JOBS_READY, DIR_JOBS_PENDING, QUEUE_LENGTH_HEADER } = global.CONFIGURATION

const jobs = require(rootdir+'/lib/jobs')


module.exports = function init(app) {
  app.use('/v1/convert', require('express').json(), convertRequest)
}



function convertRequest(req, res) {
  // No source file to convert specified
  if (!req.body.file) return res.status(500).send('"ERROR: Missing file parameter!"')

  const jobid = jobs.create()

  const filepath = path.join(DIR_JOBS_PENDING, jobid, 'src/game.js')
  const metapath = path.join(DIR_JOBS_PENDING, jobid, 'job.json')
  const job = {}

  job.type = 'convert'
  job.target = req.query.target || 'arduboy' //TODO: target selection
  job.id = jobid
  job.started = Date.now()

  fs.outputFile(filepath, req.body.file).then(
    _ => fs.outputJson(metapath, job)
  )

  res.setHeader(QUEUE_LENGTH_HEADER, job.queue||0)
  res.json({ job: jobid })

  console.log('Converting ', filepath+'…')
}
