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

var actorId = 0;
var dynamicBodyDef  = new b2BodyDef;
dynamicBodyDef.type = b2Body.b2_dynamicBody;

function Actor(texture, width, height) {
  this.id = actorId++;
  this.state = "idle";
  this.width = width;
  this.height = height;
  boxFixDef.shape.SetAsBox(this.width/b2Scale/2,this.height/b2Scale/2);
  var x = getRandomInt(0, SCREEN_WIDTH - this.width)
  var y = getRandomInt(0, SCREEN_HEIGHT - this.height)
  dynamicBodyDef.position.Set(x/b2Scale, y/b2Scale)
  this.body = world.CreateBody(dynamicBodyDef)
  this.body.SetLinearDamping(1);
  this.body.CreateFixture(boxFixDef);
  this.sprite = new PIXI.Sprite(texture);
  this.sprite.interactive = true;
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 0.5;
  this.sprite.position.x = x;
  this.sprite.position.y = y;
}

var sheepTexture = PIXI.Texture.fromImage("sheep.gif");
var sheepWidth = 84;
var sheepHeight = 73;
function Sheep() {
  Actor.call(this, sheepTexture, sheepWidth, sheepHeight);
  if (this.click) {
    this.sprite.click = this.click.bind(this);
  }
}
Sheep.prototype = Object.create(Actor.prototype);
Sheep.prototype.click = function(evt) {
  sheeps.randomAttack(this);
}

var sharkTexture = PIXI.Texture.fromImage("shark.png");
var sharkWidth = 128;
var sharkHeight = 128;
function Shark() {
  Actor.call(this, sharkTexture, sharkWidth, sharkHeight);
  if (this.click) {
    this.sprite.click = this.click.bind(this);
  }
}
Shark.prototype = Object.create(Actor.prototype);
// Shark.prototype.click = function(evt) {
//   sharks.randomAttack(this);
// }

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function Actors() {}
Actors.prototype = new Array
Actors.prototype.setPositions = function () {
  for (var i = 0; i < this.length; i++) {
    var pos = this[i].body.GetPosition();
    this[i].sprite.x = pos.x * b2Scale;
    this[i].sprite.y = pos.y * b2Scale;
    //this[i].sprite.rotation = this[i].body.GetAngle();
  }
}

Actors.prototype.randomAttack = function(actor) {
  var pick = actor.id;
  while (pick == actor.id) {
    pick = getRandomInt(0, this.length);
  }
  var impulse = actor.body.GetWorldCenter()
  impulse.Subtract(this[pick].body.GetWorldCenter());
  this[pick].body.ApplyImpulse(impulse, this[pick].body.GetWorldCenter());
}

function drawRectAABB(g, aabb) {
  return g.drawRect(aabb.lowerBound.x * b2Scale,
                           aabb.lowerBound.y * b2Scale,
                           (aabb.upperBound.x - aabb.lowerBound.x) * b2Scale,
                           (aabb.upperBound.y - aabb.lowerBound.y) * b2Scale)
}

Actors.prototype.debugBodies = function(init) {
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

var baseScale = 1;
var sheeps = new Actors;
function initSheeps(num) {
  for (var i = 0; i < num; i++) {
    var s = new Sheep(sheepTexture);
    sheeps.push(s);
    stage.addChild(s.sprite);
  }
}

var sharks = new Actors;
function initSharks(num) {
  for (var i = 0; i < num; i++) {
    var s = new Shark(sharkTexture);
    sharks.push(s);
    stage.addChild(s.sprite);
  }
}


function gameLogic() {
  world.Step(1/60, 3, 3);
  if (DEBUG) {
    sheeps.debugBodies(false);
    sharks.debugBodies(false);
  }
  world.ClearForces();
  sheeps.setPositions();
  sharks.setPositions();
  //moveSheeps(sheeps);
}

function animate() {
  gameLogic()
  renderer.render(stage);
  requestAnimationFrame(animate);
}

function init() {
  initSheeps(2);
  initSharks(3);
  if (DEBUG) {
    sheeps.debugBodies(true);
    sharks.debugBodies(true);
  }
  requestAnimationFrame(animate);
}

init();
