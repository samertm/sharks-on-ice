"use strict";
var SCREEN_WIDTH  = 1200;
var SCREEN_HEIGHT = 800;
var DEBUG         = false;
var renderer      = new PIXI.WebGLRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);
var graphics      = new PIXI.Graphics

document.body.appendChild(renderer.view);

var b2Vec2          = Box2D.Common.Math.b2Vec2;
var b2BodyDef       = Box2D.Dynamics.b2BodyDef;
var b2Body          = Box2D.Dynamics.b2Body;
var b2FixtureDef    = Box2D.Dynamics.b2FixtureDef;
var b2Fixture       = Box2D.Dynamics.b2Fixture;
var b2World         = Box2D.Dynamics.b2World;
var b2MassData      = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape  = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape   = Box2D.Collision.Shapes.b2CircleShape;
var b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
var b2AABB          = Box2D.Collision.b2AABB
var b2DebugDraw     = Box2D.Dynamics.b2DebugDraw;

var world = new b2World(new b2Vec2(0, 0), true);
var stage = new PIXI.Stage(0x00B200, true);
stage.interactive = true;
var b2Scale = 100;

var boxFixDef = new b2FixtureDef();
boxFixDef.shape = new b2PolygonShape();
var staticBodyDef = new b2BodyDef();
staticBodyDef.type = b2Body.b2_staticBody;
// bottom
boxFixDef.shape.SetAsBox(SCREEN_WIDTH/b2Scale, 1);
staticBodyDef.position.Set(9, SCREEN_HEIGHT/b2Scale + 1);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);
// top
boxFixDef.shape.SetAsBox(SCREEN_WIDTH/b2Scale , 0);
staticBodyDef.position.Set(9, 0);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);
boxFixDef.shape.SetAsBox(1, 100);
// left wall
staticBodyDef.position.Set(-1, 3);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);
// right wall
staticBodyDef.position.Set(SCREEN_WIDTH/100 + 1, 3);
world.CreateBody(staticBodyDef).CreateFixture(boxFixDef);

var actorId         = 0;
var dynamicBodyDef  = new b2BodyDef;
dynamicBodyDef.type = b2Body.b2_dynamicBody;

function Actor(texture, width, height, restitution) {
  this.id = actorId++;
  this.state = "idle";
  this.width = width;
  this.height = height;
  boxFixDef.shape.SetAsBox(this.width/b2Scale/2,this.height/b2Scale/2);
  boxFixDef.restitution = restitution;
  var x = getRandomInt(0, SCREEN_WIDTH - this.width)
  var y = getRandomInt(0, SCREEN_HEIGHT - this.height)
  dynamicBodyDef.position.Set(x/b2Scale, y/b2Scale)
  this.body = world.CreateBody(dynamicBodyDef)
  this.body.SetLinearDamping(1);
  this.body.CreateFixture(boxFixDef);
  this.body.actor = this;
  this.sprite = new PIXI.Sprite(texture);
  this.sprite.interactive = true;
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 0.5;
  this.sprite.position.x = x;
  this.sprite.position.y = y;
}

var sheepTexture = PIXI.Texture.fromImage("sheep.gif");
var sheepWidth   = 84;
var sheepHeight = 73;
function Sheep() {
  Actor.call(this, sheepTexture, sheepWidth, sheepHeight, .8);
  if (this.click) {
    this.sprite.click = this.click.bind(this);
  }
}
Sheep.prototype = Object.create(Actor.prototype);
Sheep.prototype.constructor = Sheep;
// Sheep.prototype.click = function(evt) {
//   sharks.randomAttack(this);
// }

var sharkTexture = PIXI.Texture.fromImage("shark.png");
var sharkWidth   = 128;
var sharkHeight = 128;
function Shark() {
  Actor.call(this, sharkTexture, sharkWidth, sharkHeight, .2);
  this.target = null;
  this.body.GetFixtureList().SetDensity(4);
  this.body.ResetMassData();
  if (this.click) {
    this.sprite.click = this.click.bind(this);
  }
}
Shark.prototype = Object.create(Actor.prototype);
Shark.prototype.constructor = Shark;
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

Actors.prototype.set = function(field, value) {
  for (var i = 0; i < this.length; i++) {
    this[i][field] = value;
  }
}

Actors.prototype.getOne = function(field, compareFn) {
  for (var i = 0; i < this.length; i++) {
    if (compareFn(this[i][field])) {
      return this[i];
    }
  }
}

Actors.prototype.get = function(field, compareFn) {
  var v = new Actors
  for (var i = 0; i < this.length; i++) {
    if (compareFn(this[i][field])) {
      v.push(this[i]);
    }
  }
  return v;
}

Actors.prototype.doFor = function(doFn) {
  for (var i = 0; i < this.length; i++) {
    doFn(this[i]);
  }
}

Actors.prototype.random = function() {
  return this[getRandomInt(0, this.length)];
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

sharks.setAttackSheep = function() {
  var s = this.getOne("state", function(t) { return t === "attack"; })
  if (s == null) {
    // Find a shark to attack and give it a target.
    s = sharks.random();
    s.state = "attack";
    s.target = sheeps.random();
  }
}

sharks.attack = function() {
  sharks.doFor(function(shark) {
    if (shark.state == "attack") {
      var impulse = shark.target.body.GetWorldCenter().Copy();
      impulse.Subtract(shark.body.GetWorldCenter());
      // dampen
      impulse.Normalize();
      impulse.Multiply(0.08);
      shark.body.ApplyImpulse(impulse, shark.body.GetWorldCenter());
    }
  });
}

var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
  var canvasPosition = getElementPosition(renderer.view);

document.addEventListener("mousedown", function(e) {
  isMouseDown = true;
  handleMouseMove(e);
  document.addEventListener("mousemove", handleMouseMove, true);
}, true);

document.addEventListener("mouseup", function() {
  document.removeEventListener("mousemove", handleMouseMove, true);
  isMouseDown = false;
  mouseX = undefined;
  mouseY = undefined;
}, true);

function handleMouseMove(e) {
  mouseX = (e.clientX - canvasPosition.x) / b2Scale;
  mouseY = (e.clientY - canvasPosition.y) / b2Scale;
};

function getBodyAtMouse() {
  mousePVec = new b2Vec2(mouseX, mouseY);
  var aabb = new b2AABB();
  aabb.lowerBound.Set(mouseX - 0.001, mouseY - 0.001);
  aabb.upperBound.Set(mouseX + 0.001, mouseY + 0.001);
  
  // Query the world for overlapping shapes.

  selectedBody = null;
  world.QueryAABB(getBodyCB, aabb);
  return selectedBody;
}

function getBodyCB(fixture) {
  if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
    if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
      selectedBody = fixture.GetBody();
      return false;
    }
  }
  return true;
}

//http://js-tut.aardon.de/js-tut/tutorial/position.html
function getElementPosition(element) {
  var elem=element, tagname="", x=0, y=0;
  
  while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
    y += elem.offsetTop;
    x += elem.offsetLeft;
    tagname = elem.tagName.toUpperCase();

    if(tagname == "BODY")
      elem=0;

    if(typeof(elem) == "object") {
      if(typeof(elem.offsetParent) == "object")
        elem = elem.offsetParent;
    }
  }

  return {x: x, y: y};
}

function gameLogic() {
  if(isMouseDown && (!mouseJoint)) {
    var body = getBodyAtMouse();
    if(body && body.actor instanceof Sheep) {
      console.log(body.GetAngle())
      var md = new b2MouseJointDef();
      md.bodyA = world.GetGroundBody();
      md.bodyB = body;
      md.target.Set(mouseX, mouseY);
      md.collideConnected = true;
      md.maxForce = b2Scale * 10 * body.GetMass();
      mouseJoint = world.CreateJoint(md);
      body.SetAwake(true);
    }
  }
  if(mouseJoint) {
    if(isMouseDown) {
      mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
    } else {
      world.DestroyJoint(mouseJoint);
      mouseJoint = null;
    }
  }
  world.Step(1/60, 3, 3);
  if (DEBUG) {
    sheeps.debugBodies(false);
    sharks.debugBodies(false);
  }
  world.ClearForces();
  
  sharks.setAttackSheep();
  sharks.attack();
  
  sheeps.setPositions();
  sharks.setPositions();
  
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
