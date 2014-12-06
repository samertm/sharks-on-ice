// You can use either PIXI.WebGLRenderer or PIXI.CanvasRenderer
var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 800;
var renderer = new PIXI.WebGLRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);

document.body.appendChild(renderer.view);

var stage = new PIXI.Stage(0x00B200, true);
stage.interactive = true;

var sheepTexture = PIXI.Texture.fromImage("sheep.gif");
var sheeps = [];
for (var i = 0; i < 100; i++) {
  sheeps.push(new PIXI.Sprite(sheepTexture));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// coords = {x:int, y:int, width:int, height:int}
// return bool
function collide(coord, sheeps) {
  if (coord.x+coord.width >= SCREEN_WIDTH) {
    return false;
  }
  if (coord.y+coord.height >= SCREEN_HEIGHT) {
    return false;
  }
  for (var i = 0; i < sheeps.length; i++) {
    var s = sheeps[i]
    if (coord.x >= s.x && coord.x <= s.x+s.width || // check x
        coord.x+coord.width >= s.x && coord.x+coord.width <= s.x+s.width || // check x+width
        coord.y >= s.y && coord.y <= s.y+s.height ||
        coord.y+coord.height >= s.y && coord.y+coord.height <= s.y+s.height) {
      return true
    }
  }
  return false
}

// non-overlapping
function genCoord(sheeps, width, height) {
  while (true) {
    // Generate a random coords here.
    var x = getRandomInt(0, SCREEN_WIDTH - width)
    var y = getRandomInt(0, SCREEN_HEIGHT - height)
    // Check to see if our coords conflict with any existing sheep.
    if (!collide({x:x, y:y, width:width, height:height}, sheeps)) {
      break
    }
  }
  // ty based god for function scope :)
  return {x: x, y: y}
}

var baseScale = .5
function initSheeps(sheeps) {
  for (var i = 0; i < sheeps.length; i++) {
    sheeps[i].interactive = true;
    sheeps[i].state = "idle";
    sheeps[i].scale.x = baseScale;
    sheeps[i].scale.y = baseScale;
    coord = genCoord(sheeps.slice(0, i), sheeps[i].width, sheeps[i].height);
    sheeps[i].position.x = coord.x;
    sheeps[i].position.y = coord.y;
    sheeps[i].click = function(evt) {
      this.scale.x += .5;
      this.scale.y += .5;
    }
    stage.addChild(sheeps[i]);
  }
};

initSheeps(sheeps);

requestAnimationFrame(animate);

function shrinkSheeps(sheeps) {
  var step = .1;
  for (i = 0; i < sheeps.length; i++) {
    sheeps[i].scale.x = Math.max(baseScale, sheeps[i].scale.x - step);
    sheeps[i].scale.y = Math.max(baseScale, sheeps[i].scale.y - step);
  }
}

function gameLogic() {
  shrinkSheeps(sheeps);
}

setInterval(gameLogic, 500);

function animate() {
  renderer.render(stage);
  requestAnimationFrame(animate);
}
