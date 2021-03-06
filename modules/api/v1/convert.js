/* <target> conversion:

- build.js should sort this out
- a temp file is generated but with uuid, parallel compilations shouldn't affect each other
*/

// Basically:
// ../clouduboy-compiler$  node build.js $1 > data/compile.log
// (also outputs data/game.ino)

const fs = require('fs-extra')
const path = require('path')

const cors = require('cors')
const json = require('express').json

const corsConfig = { allowedHeaders: 'QUEUE_LENGTH_HEADER' }

const {
  rootdir,
  DIR_JOBS_READY,
  DIR_JOBS_PENDING,
  QUEUE_LENGTH_HEADER,
} = require(__filename.replace(/\bmodules\b.*/,'config.js'))()

const jobs = require(rootdir+'/modules/lib/jobs')


module.exports = function init(app) {
  // enable cross-origin requests
  app.options('/api/v1/convert', cors())

  app.use('/api/v1/convert', cors(corsConfig), json(), convertRequest)
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
