/* Keeps track of incoming requests and makes sure they are all fullfilled */

const fs = require('fs-extra')
const path = require('path')
const uniqueId = require('uuid/v1')

// Configuration
const { rootdir, DIR_JOBS_READY, DIR_JOBS_PENDING, HOST_URL_READY } = global.CONFIGURATION

// FIFO list of pending jobs
const jobs = []
const ready = new Map()



module.exports = {
  processQueue,
  status,
  create
}

function create() {
  const jobid = uniqueId()
  jobs.push(jobid)
  return jobid
}

function status(jobid) {
  const queue = jobs.indexOf(jobid) + 1
  const jobinfo = queue ? undefined : ready.get(jobid)

  return {
    status: ready ? 'ready' : (queue > 0 ? 'queued' : undefined),
    queue,
    info: Object.assign({}, jobinfo)
  }
}

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
            const build = require(path.join(rootdir, '../clouduboy-compiler'))

            build('arduboy', fs.readFileSync(path.join(sourcepath, 'game.js')).toString(), json.srcid||"game").then(game => {
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
        device_code: jobUrl+`${json.srcid||'game'}.${json.target}.ino`,
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
