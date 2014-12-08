"use strict";
var SCREEN_WIDTH  = 1200;
var SCREEN_HEIGHT = 800;
var DEBUG         = false;
var renderer      = new PIXI.WebGLRenderer(SCREEN_WIDTH, SCREEN_HEIGHT);
var graphics      = new PIXI.Graphics

document.body.appendChild(renderer.view);

var b2Vec2            = Box2D.Common.Math.b2Vec2;
var b2BodyDef         = Box2D.Dynamics.b2BodyDef;
var b2Body            = Box2D.Dynamics.b2Body;
var b2FixtureDef      = Box2D.Dynamics.b2FixtureDef;
var b2Fixture         = Box2D.Dynamics.b2Fixture;
var b2World           = Box2D.Dynamics.b2World;
var b2ContactListener = Box2D.Dynamics.b2ContactListener;
var b2MassData        = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape    = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape     = Box2D.Collision.Shapes.b2CircleShape;
var b2MouseJointDef   =  Box2D.Dynamics.Joints.b2MouseJointDef
var b2AABB            = Box2D.Collision.b2AABB
var b2DebugDraw       = Box2D.Dynamics.b2DebugDraw;

var world = new b2World(new b2Vec2(0, 0), true);
var stage = new PIXI.Stage(0x66CCCC, true);
stage.interactive = true;
stage.addChildUpdate = function(thing) {
  this.addChild(thing);
  if (this.textContainer) {
    this.removeChild(this.textContainer);
    this.addChild(this.textContainer);
  }
}
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

var gameState = {
  scoreText:  new PIXI.Text("Score: 0", {fill: "white"}),
  score: 0,
  addFish: 0,
  addScore: function(x) {
    this.addFish += x % 4; 
    this.score += x;
    this.scoreText.setText("Score: " + this.score);
  },
}
stage.textContainer = gameState.scoreText;

var actorId         = 0;
var dynamicBodyDef  = new b2BodyDef;
dynamicBodyDef.type = b2Body.b2_dynamicBody;

function Actor(sprite, width, height, restitution, dontCreateBody) {
  this.id = actorId++;
  this.state = "alive";
  this.width = width;
  this.height = height;
  this.restitution = restitution;
  var x = getRandomInt(0, SCREEN_WIDTH - this.width)
  var y = getRandomInt(0, SCREEN_HEIGHT - this.height)
  this.sprite = sprite;
  this.sprite.interactive = true;
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 0.5;
  this.sprite.position.x = x;
  this.sprite.position.y = y;
  if (!dontCreateBody) {
    this.body = this.createBody()
  } else {
    console.log("YO")
  }
}
Actor.prototype.createBody = function() {
  boxFixDef.shape.SetAsBox(this.width/b2Scale/2,this.height/b2Scale/2);
  boxFixDef.restitution = this.restitution;
  dynamicBodyDef.position.Set(this.sprite.position.x/b2Scale, this.sprite.position.y/b2Scale)
  var body = world.CreateBody(dynamicBodyDef)
  body.SetLinearDamping(1);
  body.CreateFixture(boxFixDef);
  body.actor = this;
  return body;
}

var fishAliveTexture = PIXI.Texture.fromImage("fish-alive.png");
var fishDeadTexture  = PIXI.Texture.fromImage("fish-dead.png");
var fishWidth        = 64;
var fishHeight       = 44;
function Fish() {
  Actor.call(this, new PIXI.Sprite(fishAliveTexture), fishWidth, fishHeight, .8, false);
}
Fish.prototype = Object.create(Actor.prototype);
Fish.prototype.constructor = Fish;
Fish.prototype.setDead = function() {
  this.state = "dead";
  var old = this.sprite;
  this.sprite = new PIXI.Sprite(fishDeadTexture);
  this.sprite.interactive = true;
  this.sprite.anchor.x = 0.5;
  this.sprite.anchor.y = 0.5;
  this.sprite.position.x = old.x;
  this.sprite.position.y = old.y;
  stage.removeChild(old);
  stage.addChildUpdate(this.sprite);
}

var sharkTexture = PIXI.Texture.fromImage("shark.png");
var sharkWidth   = 128;
var sharkHeight = 128;
function Shark() {
  Actor.call(this, new PIXI.Sprite(sharkTexture), sharkWidth, sharkHeight, .2, false);
  this.target = null;
  this.body.GetFixtureList().SetDensity(4);
  this.body.ResetMassData();
}
Shark.prototype = Object.create(Actor.prototype);
Shark.prototype.constructor = Shark;

var foodRed64Texture    = new PIXI.Texture.fromImage("food-red64.png");
var foodYellow32Texture = new PIXI.Texture.fromImage("food-yellow32.png");
var foodPurple16Texture = new PIXI.Texture.fromImage("food-purple16.png");
var foodBlue8Texture    = new PIXI.Texture.fromImage("food-blue8.png");
function Food(dontCreateBody) {
  var s, size;
  var r = getRandomInt(0, 15);
  if (r < 8) {
    this.score = 1;
    this.color = "red";
    size = 64
    s = new PIXI.Sprite(foodRed64Texture);
  } else if (r < 12) {
    this.score = 2;
    this.color = "yellow";
    size = 32;
    s = new PIXI.Sprite(foodYellow32Texture);
  } else if (r < 14) {
    this.score = 4;
    this.color = "purple";
    size = 16;
    s = new PIXI.Sprite(foodPurple16Texture);
  } else {
    this.score = 8;
    this.color = "blue";
    size = 8;
    s = new PIXI.Sprite(foodBlue8Texture);
  }
  Actor.call(this, s, size, size, .4, dontCreateBody, false)
}
Food.prototype = Object.create(Actor.prototype);
Food.prototype.constructor = Food;

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
      stage.addChildUpdate(this[i].debug)
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

var deleteFromWorld = [];
Actors.prototype.remove = function(id) {
  var removed;
  for (var i = 0; i < this.length; i++) {
    if (this[i].id == id){
      removed = this.splice(i, 1)[0];
    }
  }
  if (!removed) {
    return;
  }
  deleteFromWorld.push(removed.body);
  stage.removeChild(removed.sprite);
  return removed;
}

var baseScale = 1;
var fishes = new Actors;
function initFishes(num) {
  for (var i = 0; i < num; i++) {
    var s = new Fish(fishAliveTexture);
    fishes.push(s);
    stage.addChildUpdate(s.sprite);
  }
}

var sharks = new Actors;
function initSharks(num) {
  for (var i = 0; i < num; i++) {
    var s = new Shark(sharkTexture);
    sharks.push(s);
    stage.addChildUpdate(s.sprite);
  }
}

sharks.setAttackFish = function() {
  this.doFor(function(s) {
    if (s.state != "attack") {
      s.state = "attack";
      s.target = fishes.random();
    }
    if (s.target.state == "dead") {
      s.target = null;
      s.state = "alive";
    }
  })            
}

sharks.attack = function() {
  this.doFor(function(shark) {
    if (shark.state == "attack") {
      var impulse = shark.target.body.GetWorldCenter().Copy();
      impulse.Subtract(shark.body.GetWorldCenter());
      // dampen
      impulse.Normalize();
      impulse.Multiply((gameState.score + 1) * 0.03);
      shark.body.ApplyImpulse(impulse, shark.body.GetWorldCenter());
    }
  });
}

var foods = new Actors;
function initFoods(num) {
  for (var i = 0; i < num; i++) {
    var s = new Food(false);
    foods.push(s);
    stage.addChildUpdate(s.sprite);
  }
}
var addToWorld = [];
foods.addFood = function() {
  var s = new Food(true);
  foods.push(s);
  addToWorld.push(s);
  stage.addChildUpdate(s.sprite);
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

var foodToAdd = 0;
function gameLogic() {
  if(isMouseDown && (!mouseJoint)) {
    var body = getBodyAtMouse();
    if(body && body.actor instanceof Fish && body.actor.state == "alive") {
      sharks.doFor(function(shark) {
        shark.state = "attack";
        shark.target = body.actor;
      });
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
      sharks.doFor(function(shark) {
        shark.state = "alive";
        shark.target = null;
      });
      world.DestroyJoint(mouseJoint);
      mouseJoint = null;
    }
  }
  world.Step(1/60, 3, 3);
  if (DEBUG) {
    fishes.debugBodies(false);
    sharks.debugBodies(false);
  }
  world.ClearForces();
  for (var i = 0; i < foodToAdd; i++) {
    console.log(foodToAdd)
    var foood = new Food(false);
    foods.push(foood);
    stage.addChildUpdate(foood.sprite);
  }
  foodToAdd = 0
  if (gameState.addFish > 0 && fishes.length < 25) {
      var s = new Fish(fishAliveTexture);
      fishes.push(s);
      stage.addChildUpdate(s.sprite);
    gameState.addFish--
  } else {
    fishes.remove(fishes.getOne("state", function(s) { return s == "dead" }))
  }
  gameState.addFish = 0;
  for (var i = 0; i < deleteFromWorld.length; i++) {
    world.DestroyBody(deleteFromWorld[i]);
  }
  deleteFromWorld = [];

  sharks.setAttackFish();
  sharks.attack();

  fishes.setPositions();
  sharks.setPositions();
  foods.setPositions();

  return fishes.getOne("state", function(s) { return s == "alive" }) != undefined
}

var previousTimestamp = performance.now()
function animate(timestamp) {
  if (gameLogic()) {
    renderer.render(stage);
    requestAnimationFrame(animate);
  } else {
    console.log("you lose!")
    stage.removeChild(stage.textContainer);
    stage.removeChild(startText);
    stage.textContainer = undefined;
    var t = new PIXI.Text("Game over! Your score is " + gameState.score + ". You did alright.", {fill: "white"})
    t.position.x = 300;
    t.position.y = SCREEN_HEIGHT/2;
    stage.addChildUpdate(t);
    renderer.render(stage);
  }
}

var startText;
function init() {
  // show instructions
  startText  = new PIXI.Text("Eat the smaller blocks to spawn fishy friends!", {fill: "white"})
  startText.position.x = 300;
  startText.position.y = SCREEN_HEIGHT/2;
  stage.addChildUpdate(startText)
  initFishes(1);
  initSharks(3);
  initFoods(15);
  if (DEBUG) {
    fishes.debugBodies(true);
    sharks.debugBodies(true);
  }
  var contactListener = new b2ContactListener;
  contactListener.BeginContact = function(contact) {
    var actors = {};
    var a = contact.GetFixtureA().GetBody().actor;
    if (a) {
      actors[a.constructor.name] = a;
    }
    var b = contact.GetFixtureB().GetBody().actor;
    if (b) {
      actors[b.constructor.name] = b;
    }
    if (actors["Shark"] && actors["Fish"]) {
      actors["Fish"].setDead();
    } else if (actors["Fish"] && actors["Fish"].state == "alive" && actors["Food"]) {
      // Delete fixture and sprite.
      var f = foods.remove(actors["Food"].id);
      if (f) {
        gameState.addScore(f.score);
      }      
      foodToAdd++;
    }
  }
  world.SetContactListener(contactListener);
  requestAnimationFrame(animate);
}

init();
