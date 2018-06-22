/* Job status

After a conversion/compilation begins, the client receives a unique
job ID. When the processing has finished the traslation/compilation
output (artifacts) and logs are accessible via the ID of the job for
some arbitrary cleanup timeout (e.g. 1 hour, or a day).

The client can request information, current status and links to
compiled artifacts via this endpoint.

Returns:
- `HTTP/404` - when the job ID is not found (e.g. has already been cleaned up)
- `HTTP/204` - processing is still not finished, no results yet
- `HTTP/200` + `json` - processing finished, artifact metadata is in the
  returned json.

*/

const cors = require('cors')

const {
  rootdir,
  QUEUE_LENGTH_HEADER,
} = require(__filename.replace(/\bmodules\b.*/,'config.js'))()

const jobs = require(rootdir+'/modules/lib/jobs')



module.exports = function(app) {
  app.use('/api/v1/job/:jobid', cors(), jobRequest)
  app.use('/api/v1/jobs', cors(), jobListing)
}



function jobRequest(req, res) {
  const jobid = req.params.jobid

  const job = jobs.status(jobid)

  console.log('Polling for ', jobid, job)
  res.setHeader(QUEUE_LENGTH_HEADER, job.queue)


  // Job is ready
  if (job.status === 'ready') {
    res.json(job.info)

  // Job is still in the queue (waiting for) being processed
  } else if (job.status === 'queued') {
    res.status(204).send()

  // Job does not exist
  } else {
    res.status(404).send()

  }
}


function jobListing(req, res) {
  let queue = jobs.dumpQueue()
  let listing = {
    jobs: queue
  }

  console.log(queue)
  res.json(listing)
}
