/* Keeps track of incoming requests and makes sure they are all fullfilled */

const fs = require('fs-extra')
const path = require('path')
const uniqueId = require('uuid/v1')

// Configuration
const { rootdir, DIR_JOBS_READY, DIR_JOBS_PENDING } = global.CONFIGURATION

// FIFO list of pending jobs
const jobs = []
const ready = new Map()


// Job Descriptor
const Job = Object.assign(new Function,

// Static methods (Job.<method>())
{
  // Load Job from a stored job descriptor in the filesystem
  load(jobid, folder) {
    // Try loading from PENDING folder if no other is specified
    return fs.readJson(path.join(folder||DIR_JOBS_PENDING, jobid, 'job.json'))
      // Not found in pending, check in READY folder
      .catch( _ => fs.readJson(path.join(DIR_JOBS_READY, jobid, 'job.json')))
      .then(json => Job.from(json))
  },

  // Create job object from existing in-memory json descriptor (and not a file)
  from(object) {
    return Object.assign(Object.create(Job.prototype), object)
  },


  // Instance methods (myJob.<method>())
  prototype: {
    // The current path to the job. Jobs are in the "pending" folder until they
    // change to a "ready" status, when they are immediately moved to the "ready" folder
    path() {
      let job = this

      return path.join(this.status === 'ready' ? DIR_JOBS_READY : DIR_JOBS_PENDING, job.id)
    },

    // Save job (update job descriptor on disk). Automatically move job to the READY folder
    // if status changes to "ready".
    update(updateObject) {
      let job = this

      // Just finished -- move job source to the "ready" folder and resume status update
      if (updateObject.status === 'ready' && job.status != updateObject.status) {
        const sourcepath = job.path()

        job.status = 'ready';
        const readypath = job.path()

        return fs.move(sourcepath, readypath)
          .then( _ => job.update(updateObject))
          // Return the job so te result is available/chainable
          .then( _ => job )
      }

      // Update Job metadata
      job = Object.assign(job, updateObject)

      const jobid = job.id
      const sourcepath = path.join(job.status === 'ready' ? DIR_JOBS_READY : DIR_JOBS_PENDING, jobid, 'job.json')

      // Write updated metadata to the filesystem
      return fs.outputJson(sourcepath, job).then( _ => job)
    },

    // Errored
    fail(error) {
      console.error(error)
      this.update({
        error_message: error.toString(),
        error_trace: error.stack
      })
    }
  }

}) // End of Job Descriptor object blueprint






module.exports = {
  processQueue,
  dumpQueue,
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

function dumpQueue() {
  return jobs.map(job => status(job))
}

function processJob() {
  const jobid = jobs[0]

  // No jobs to process
  if (!jobid) return Promise.resolve()


  // Load Job and start processing
  return Job.load(jobid)
    .then(job => {
      // Load current task module for the job at hand
      let task
      switch (job.type) {
        case 'convert':
        case 'compile':
          task = require('./'+job.type+'.js')
          break

        default:
          throw new Error('Not Implemented: '+job.type)
      }

      // If processing hasn't been started yet, start it
      if (!job.status) {
        return task.execute(job)
      }

      // Wait until processing is finished
      if (job.status === 'finished') {
        // Task finished, finalize it and do the cleanup
        return task.cleanup(job)
          .then( updatedJob => {
            jobs.shift()
            ready.set(updatedJob.id, updatedJob)
            console.log('Job ', updatedJob.id, ' finished.')
            return updatedJob
          })
      }

      console.log(job.id, ' not finished yet.')
    })
}
