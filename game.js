"use strict";
var SCREEN_WIDTH = 1200;
var SCREEN_HEIGHT = 800;
var DEBUG = false;
var renderer = new PIXI.WebGLRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);
var graphics = new PIXI.Graphics

document.body.appendChild(renderer.view);

var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

var world = new b2World(new b2Vec2(0, 0), true);
var stage = new PIXI.Stage(0x00B200, true);
stage.interactive = true;
var b2Scale = 100;

var boxFixDef = new b2FixtureDef();
boxFixDef.shape = new b2PolygonShape();
var staticBodyDef = new b2BodyDef();
staticBodyDef.type = b2Body.b2_staticBody;
boxFixDef.shape.SetAsBox(SCREEN_WIDTH/b2Scale, 2);
staticBodyDef.position.Set(9, SCREEN_HEIGHT/100 + 1);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);

boxFixDef.shape.SetAsBox(SCREEN_WIDTH/b2Scale, 1);
staticBodyDef.position.Set(9, 0);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);
boxFixDef.shape.SetAsBox(1, 100);
// left wall
staticBodyDef.position.Set(-1, 3);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);
// right wall
staticBodyDef.position.Set(SCREEN_WIDTH/100 + 1, 3);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);

var sheepId = 0;
var sheepFixDef = new b2FixtureDef;
sheepFixDef.shape = new b2PolygonShape;
var sheepBodyDef = new b2BodyDef;
sheepBodyDef.type = b2Body.b2_dynamicBody;
function Sheep(texture) {
  this.id = sheepId++;
  this.state = "idle";
  // HACK
  this.width = 84;
  this.height = 73;
  sheepFixDef.shape.SetAsBox(this.width/b2Scale/2,this.height/b2Scale/2);
  var x = getRandomInt(0, SCREEN_WIDTH - this.width)
  var y = getRandomInt(0, SCREEN_HEIGHT - this.height)
  sheepBodyDef.position.Set(x/b2Scale, y/b2Scale)
  this.body = world.CreateBody(sheepBodyDef)
  this.body.SetLinearDamping(1);
  this.body.CreateFixture(sheepFixDef);
  this.sprite = new PIXI.Sprite(texture);
  this.sprite.interactive = true;
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 0.5;
  this.sprite.position.x = x;
  this.sprite.position.y = y;
  // FIXME: fix this later
  this.sprite.click = function(evt) {
    sheeps.randomAttack(this);
  }.bind(this)
}

var sheepTexture = PIXI.Texture.fromImage("sheep.gif");

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
var sheeps = [];
function initSheeps(numSheeps) {
  for (var i = 0; i < numSheeps; i++) {
    var s = new Sheep(sheepTexture);
    sheeps.push(s);
    stage.addChild(s.sprite);
  }
}

sheeps.setPositions = function () {
  for (var i = 0; i < this.length; i++) {
    var pos = this[i].body.GetPosition();
    this[i].sprite.x = pos.x * b2Scale;
    this[i].sprite.y = pos.y * b2Scale;
    ///this[i].sprite.rotation = this[i].body.GetAngle();
  }
}

sheeps.randomAttack = function(sheep) {
  var pick = sheep.id;
  while (pick == sheep.id) {
    pick = getRandomInt(0, this.length);
  }
  var impulse = sheep.body.GetWorldCenter()
  impulse.Subtract(this[pick].body.GetWorldCenter());
  impulse.Normalize()
  this[pick].body.ApplyImpulse(impulse, this[pick].body.GetWorldCenter());
}

function drawRectAABB(g, aabb) {
  return g.drawRect(aabb.lowerBound.x * b2Scale,
                           aabb.lowerBound.y * b2Scale,
                           (aabb.upperBound.x - aabb.lowerBound.x) * b2Scale,
                           (aabb.upperBound.y - aabb.lowerBound.y) * b2Scale)
}

sheeps.debugBodies = function(init) {
  for (var i = 0; i < this.length; i++) {
    if (init) {
      var debug = new PIXI.Graphics
      debug.lineStyle(3, 0x000000)
      debug.beginFill(0x00fb30, 0)
      this[i].debug = debug
      stage.addChild(this[i].debug)
    }
    drawRectAABB(this[i].debug, this[i].body.GetFixtureList().GetAABB())
  }
}

function shrinkSheeps(sheeps) {
  // FIXME: probably buggy
  return
  var step = .1;
  for (var i = 0; i < sheeps.length; i++) {
    sheeps[i].scale.x = Math.max(baseScale, sheeps[i].scale.x - step);
    sheeps[i].scale.y = Math.max(baseScale, sheeps[i].scale.y - step);
  }
}

function gameLogic() {
  world.Step(1/60, 3, 3);
  if (DEBUG) {
    sheeps.debugBodies(false);
  }
  world.ClearForces();
  sheeps.setPositions();
  //moveSheeps(sheeps);
  //shrinkSheeps(sheeps);
}

function animate() {
  gameLogic()
  renderer.render(stage);
  requestAnimationFrame(animate);
}

function init() {
  initSheeps(5);
  if (DEBUG) {
    sheeps.debugBodies(true)
  }
  requestAnimationFrame(animate);
}

init();
