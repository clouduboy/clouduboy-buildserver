'use strict'

// Dependencies
const fs = require('fs-extra')
const path = require('path')

const express = require('express')
const uniqueId = require('uuid/v1')



// Load configuratopn
const CFG = require('./config.js')()
const QUEUE_LENGTH_HEADER = 'x-queue-length'

const DIR_JOBS_PENDING = path.join(CFG.rootdir, '/data/jobs/pending')
const DIR_JOBS_READY   = path.join(CFG.rootdir, '/data/jobs/ready')

const HOST_URL_READY = CFG.host_url+CFG.host_path_ready


// Init server
const server = express()
server.use('/r', express.static(DIR_JOBS_READY, { fallthrough: false }))

// Serve on port XXXX
server.listen(CFG.port)
console.log(`Clouduboy Build Server starting on :${CFG.port}`)


// FIFO list of pending jobs
const jobs = []
const ready = new Map()

processQueue()



function processQueue() {
  processJob().catch(e => console.log(e)).then(setTimeout(processQueue, 100))
}
function processJob() {
  const jobid = jobs[0]

  if (jobid) {
    const sourcepath = path.join(DIR_JOBS_PENDING, jobid)
    const readypath = path.join(DIR_JOBS_READY, jobid)

    let jobmeta;

    return fs.readJson(path.join(sourcepath, 'job.json'))
    .then(json => {
      if (!json.status) {
        switch (json.type) {
          case 'convert':
            // TODO: require from project dependency
            const build = require('../clouduboy-compiler')

            build('arduboy', fs.readFileSync(path.join(sourcepath, 'game.js')).toString(), json.id||"game").then(game => {
              fs.writeFileSync(path.join(sourcepath, `${game.id}.${game.target}.ino`), game.ino||'')

              // Strip source code info from the log
              let log = game.compileLog.map(e => Object.assign({}, e, { src: undefined }))
              // Don't show debug messages
              log = log.filter(e => e.lvl !== '')
              fs.writeFileSync(path.join(sourcepath, 'compile.json'), JSON.stringify(log, null, 2))
              // TODO: consider exposing typed source?
              //fs.writeFileSync('data/game.flow.js', game.flow.source||'')

              return fs.outputJson(path.join(sourcepath, 'job.json'), Object.assign(json, { status: 'ready' }))
            })

            return fs.outputJson(path.join(sourcepath, 'job.json'), Object.assign(json, { status: 'processing' }))
        }
      }

      // Wait until processing is finished
      if (json.status !== 'ready') {
        console.log(jobid, ' not ready yet.')
        return
      }

      const jobUrl = `${HOST_URL_READY}/${jobid}/`
      const jobmeta = Object.assign(json, {
        finished: Date.now(),
        microcanvas_code: jobUrl+'game.js',
        device_code: jobUrl+`${json.id||'game'}.${json.target}.ino`,
        binary: undefined, //TODO: compile
        log: jobUrl+'compile.json',
      })
      console.log(jobmeta)

      return (
        fs.move(sourcepath, readypath)
        .then(_ => fs.outputJson(path.join(readypath, 'job.json'), jobmeta))
        .then(_ => {
          jobs.shift()
          ready.set(jobid, jobmeta)
          console.log('Job ', jobid, ' finished')
        })
      )
    })
  }

  return Promise.resolve()
}


server.use('/v1/check', express.json(), (req,res) => {
  console.log(req.body)

  res.json({ ok: true })
})


server.use('/v1/convert', express.json(), (req,res) => {
  const jobid = uniqueId()
  jobs.push(jobid)

  // No source file to convert specified
  if (!req.body.file) return res.status(500).send('"ERROR: Missing file parameter!"')

  const filepath = path.join(DIR_JOBS_PENDING, jobid, 'game.js')
  const metapath = path.join(DIR_JOBS_PENDING, jobid, 'job.json')
  const job = {}

  job.type = 'convert'
  job.target = 'arduboy' //TODO: target selection
  job.id = jobid
  job.started = Date.now()

  //TODO:actually compile :)
  //setTimeout(function() { fs.writeJsonSync(metapath, Object.assign(fs.readJsonSync(metapath), { status: 'ready' })) }, 5000)

  fs.outputFile(filepath, req.body.file)
  .then(_ => fs.outputJson(metapath, job))

  res.setHeader(QUEUE_LENGTH_HEADER, jobs.length)
  res.json({ job: jobid })

  console.log('Converting ', filepath+'…')
})


server.use('/v1/compile', express.json(), (req,res) => {
  // TODO: implement
  console.log('Compilation not implemented yet')

  res.status(501).send('"ERROR: Compile support coming soon."')
})

server.use('/v1/job/:jobid', (req,res) => {
  const jobid = req.params.jobid
  const jobidx = jobs.indexOf(jobid) + 1
  const jobinfo = jobidx ? undefined : ready.get(jobid)

  console.log('Polling for ', jobid, jobidx)
  res.setHeader(QUEUE_LENGTH_HEADER, jobidx)


  // Job is ready
  if (jobinfo) {
    res.json(jobinfo)

  // Job is still in the queue (waiting for) being processed
  } else if (jobidx !== 0) {
    res.status(204).send()

  // Job does not exist
  } else {
    res.status(404).send()

  }

})


server.get('*', (req,res) => {
  res.sendFile(require('path').join(__dirname, 'index.html'))
})
