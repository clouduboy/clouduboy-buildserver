// Configuration
const {
  rootdir,
} = require(__filename.replace(/\bmodules\b.*/,'config.js'))()


// Main plugin module attaches the handled routes to the passed-in app
module.exports = function(app) {
  app.get('*', homePage)
}


// TODO: make this a proper testpage and have more descriptive API/docs
function homePage(req, res) {
  res.sendFile(__filename.replace(/\.js$/,'.html'))
}
