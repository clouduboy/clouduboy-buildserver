'use strict'

// Dependencies
const fs = require('fs-extra')
const path = require('path')

const express = require('express')



// Load configuratopn
const CFG = require('./config.js')()

// It's a huge pain and constant boilerplate-writing having to deal
// with this in every module. It's a static object with constant
// properties so sharing it this way has barely any drawbacks
// TODO: move away from this as sharing (=leaking) this across modules
// will certainly cause issues.
global.CONFIGURATION = CFG

const { rootdir, DIR_JOBS_READY, DIR_JOBS_PENDING, HOST_URL_READY } = CFG


// Init server
const server = express()

// Expose results/artifacts from completed compilations
server.use('/r', express.static(DIR_JOBS_READY, { fallthrough: false }))

// Serve static files and assets
server.use(express.static(rootdir+'/modules/www'))


// Serve on port XXXX
server.listen(CFG.port)
console.log(`Clouduboy Build Server starting on :${CFG.port}`)



// Microcanvas lint/error check
// This is a synchronous function and will return the MicroCanvas
// compile log as a JSON right away in the response.
// This call won't generate compiler output artifacts (e.g.
// target-specific C++ code)
require(rootdir+'/modules/api/v1/check')(server)


// Microcanvas to C conversion job
// Async, returns a job ID, needs polling for final result
require(rootdir+'/modules/api/v1/convert')(server)

// Microcanvas to device binary compilation
// Async, returns a job ID, needs polling for final result
require(rootdir+'/modules/api/v1/compile')(server)


// Get information and status of ongoing jobs
require(rootdir+'/modules/api/v1/jobs')(server)


// Home page
require(rootdir+'/modules/pages/home')(server)


// Job handling
const { processQueue } = require(rootdir+'/modules/lib/jobs')

processQueue()
