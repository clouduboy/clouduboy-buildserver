

module.exports = function(app) {
  app.use('/api/v1/check', require('express').json(), checkRequest)
}


function checkRequest(req, res) {
  console.log(req.body)

  // TODO: actual output :)
  res.json({ result: 'ok', log: [] })
}
