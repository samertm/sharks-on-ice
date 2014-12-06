// You can use either PIXI.WebGLRenderer or PIXI.CanvasRenderer
var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 800;
var renderer = new PIXI.WebGLRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);

document.body.appendChild(renderer.view);

var stage = new PIXI.Stage(0x00B200, true);
stage.interactive = true;

var sheepTexture = PIXI.Texture.fromImage("sheep.gif");


var sheeps = [];
for (var i = 0; i < 50; i++) {
  sheeps.push(new PIXI.Sprite(sheepTexture));
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function midpoint(rect) {
  return {x: (2*rect.x + rect.width) / 2, y: (2*rect.y + rect.height)}
}

function collide(r1, r2) {
  if (r1.id == r2.id) {
    return false;
  }
  return !(r2.x > r1.x+r1.width || 
           r2.x+r2.width < r1.x || 
           r2.y > r1.y+r1.height ||
           r2.y+r2.height < r1.y);
}

// rects = {x:int, y:int, width:int, height:int}
// return bool
function collideArray(rect, sheeps) {
  if (rect.x+rect.width >= SCREEN_WIDTH) {
    return true;
  }
  if (rect.y+rect.height >= SCREEN_HEIGHT) {
    return true;
  }
  for (var i = 0; i < sheeps.length; i++) {
    if (collide(rect, sheeps[i])) {
      return true
    }
  }
  return false
}

// non-overlapping
function genRect(sheeps, width, height) {
  while (true) {
    // Generate a random rects here.
    var x = getRandomInt(0, SCREEN_WIDTH - width)
    var y = getRandomInt(0, SCREEN_HEIGHT - height)
    // Check to see if our rects conflict with any existing sheep.
    if (!collideArray({x:x, y:y, width:width, height:height}, sheeps)) {
      break
    }
  }
  // ty based god for function scope :)
  return {x: x, y: y}
}

var baseScale = 1;
var id = 0;
function initSheeps(sheeps) {
  for (var i = 0; i < sheeps.length; i++) {
    sheeps[i].id = id++;
    sheeps[i].interactive = true;
    sheeps[i].state = "idle";
    // HACK
    // sheeps[i].scale.x = baseScale;
    // sheeps[i].scale.y = baseScale;
    sheeps[i].width = 84;
    sheeps[i].height = 73;
    rect = genRect(sheeps.slice(0, i), sheeps[i].width, sheeps[i].height);
    sheeps[i].position.x = rect.x;
    sheeps[i].position.y = rect.y;
    sheeps[i].click = function(evt) {
      this.scale.x += .5;
      this.scale.y += .5;
    }
    stage.addChild(sheeps[i]);
  }
};

var DEBUG = false;

function init() {
  initSheeps(sheeps);
  // if (DEBUG) {
  //   var dGraphics = new PIXI.Graphics
  //   for (var i = 0; i < sheeps.length; i++) {
  //     dGraphics.lineStyle(5);
  //     dGraphics.drawRect(sheeps[i].x, sheeps[i].y, sheepTexture.width, sheepTexture.height);
  //     dGraphics.endFill();
  //   }
  //   stage.addChild(dGraphics);
  // }
}

init();

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
