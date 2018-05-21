const src = `
"use strict";

let game = new MicroCanvas();

let gfxBats;

game.setup(function(game) {
  gfxBats = game.loadSprite(\x60! bats 16x6x2
##....#..#....##
.##...####...##.
.###.#.##.#.###.
.##############.
...##########...
....##.##.##....

...#..#..#..#...
.#.##.####.##.#.
######.##.######
###.########.###
#.....####.....#
.......##.......
\x60);
});



let x = 0, y = game.height/2;
let sx = 1, sy = 1;

let animationSpeed = 8;
let cSprite = 0;

game.loop(function() {
  // Update flapping animation
  if (game.everyXFrames(animationSpeed)) {
    cSprite = 1 - cSprite;
  }

  // Update position
  x += sx;
  y += sy;

  if (x>game.width-gfxBats.width || x < 1) sx = -sx;
  if (y>game.height-gfxBats.height || y < 1) sy = -sy;


  // Clear display, redraw background text
  game.clear();

  game.drawText("Sprite\\nDemo", 0,0, 3);

  // Draw shadow (unset pixels on screen based on the bitmap)
  game.eraseImage(gfxBats[cSprite|0], 0 +x,2 +y);
  game.eraseImage(gfxBats[cSprite|0], 2 +x,2 +y);

  // Draw Bat
  game.drawImage(gfxBats[cSprite|0], 1 +x,1 +y);
});

console.log("MicroCanvas demo");
`

const build = require('../clouduboy-compiler')
build('arduboy',src,'test').then(r => console.log(Object.keys(r)))
