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


module.exports = function init(app) {
  app.use('/v1/compile', require('express').json(), compileRequest)
}



function compileRequest(req, res) {
  // TODO: implement
  console.log('Compilation not implemented yet')

  res.status(501).send('"ERROR: Compile support coming soon."')
}
