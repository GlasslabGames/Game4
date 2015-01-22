/**
 * Created by Jerry Fu on 12/17/2014.
 */

var GlassLab = GlassLab || {};


/**
 * CreatureManager
 */
GlassLab.CreatureManager = function(game)
{

};

GlassLab.CreatureManager.prototype;

/**
 * Creature
 */
GlassLab.Creature = function(game, typeName, initialStateName)
{
    this.sprite = game.make.isoSprite(0,0,0, typeName);

    //this.sprite = game.make.sprite(0,0, typeName);
    this.game = game;
    this.state = null;

    if (initialStateName == "WaitingForFood") {
      this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(game, this));
    } else {
      this.StateTransitionTo(new GlassLab.CreatureStateIdle(game, this));
    }

    this.sprite.inputEnabled = true;
    this.sprite.draggable = false; // set this in each state

    // TODO: Input handling should be handled outside this class.
    this.sprite.events.onInputUp.add(this._onUp, this);
    this.sprite.events.onInputDown.add(this._onDown, this);
    this.sprite.anchor.setTo(0.5, 0.8);

    this.sprite.scale.x = -0.25;
    this.sprite.scale.y = 0.25;

    this.sprite.animations.add('run');
    this.standingFrame = 3;
    this.sprite.animations.frame = this.standingFrame;

    this.debugAILine = new Phaser.Line();

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

  //game.physics.isoArcade.enable(this.sprite);
    //this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
};

GlassLab.Creature.prototype._onUp = function(sprite, pointer)
{
  if (this.draggable && GLOBAL.stickyMode && !GLOBAL.dragTarget && !GLOBAL.justDropped) {
    this._startDrag();
  } else if (!GLOBAL.stickyMode && GLOBAL.dragTarget == this) {
    this._endDrag();
  }
};

GlassLab.Creature.prototype._onDown = function(sprite, pointer)
{
  if (!GLOBAL.stickyMode && this.draggable && !GLOBAL.dragTarget) {
    this._startDrag();
  }
};


GlassLab.Creature.prototype._startDrag = function() {
  if (GLOBAL.dragTarget != null) return;
  this.sprite.animations.stop(null, true);
  this.sprite.animations.play("run", 96, true);
  this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
  GLOBAL.dragTarget = this;
};

GlassLab.Creature.prototype._endDrag = function() {
  this.sprite.animations.stop(null, true);
  this.sprite.animations.frame = this.standingFrame;
  this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
  GLOBAL.dragTarget = null;
};

GlassLab.Creature.prototype.OnStickyDrop = function() { // called by (atm) prototype.js
  this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function() {
  if (this.state) this.state.Update();

  //if (this.rightKey.justDown) { }
};

GlassLab.Creature.prototype.StateTransitionTo = function(targetState)
{
    if (targetState == this.state)
    {
        console.warn("Target state was the same as current state, ignoring transition request...");
        return;
    }

    if (this.state)
    {
        this.state.Exit();
    }

    this.state = targetState;

    if (this.state)
    {
        this.state.Enter();
    }
};

/**
 * CreatureState
 */
GlassLab.CreatureState = function(game, owner)
{
    this.creature = owner;
    this.game = game;
};

GlassLab.CreatureState.prototype.Enter = function() {
  //console.log("Enter");
};

GlassLab.CreatureState.prototype.Exit = function() {
  //console.log("Exit");
};

GlassLab.CreatureState.prototype.Update = function() {};

/**
 * CreatureStateIdle
 */
GlassLab.CreatureStateIdle = function(game, owner)
{
    GlassLab.CreatureState.call(this, game, owner);

    this.targetPosition = new Phaser.Point();
    this.targetIsoPoint = new Phaser.Plugin.Isometric.Point3();
    this.findDestinationTimer = null;
};

GlassLab.CreatureStateIdle.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateIdle.constructor = GlassLab.CreatureStateIdle;

GlassLab.CreatureStateIdle.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);

    this.findDestinationHandler = this.game.time.events.add(Math.random()*3000 + 2000, this._findNewDestination, this);
    this.creature.draggable = true;
};

GlassLab.CreatureStateIdle.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);

    if (this.findDestinationHandler)
    {
        this.game.time.events.remove(this.findDestinationHandler);
        this.findDestinationHandler = null;
    }
};

GlassLab.CreatureStateIdle.prototype._findNewDestination = function()
{
    GLOBAL.tileManager.GetTileIndexAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY, this.targetPosition);

    // Build list of possible movements
    var possiblePositions = [];
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x+1, this.targetPosition.y);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x+1, this.targetPosition.y));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x-1, this.targetPosition.y);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x-1, this.targetPosition.y));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x, this.targetPosition.y+1);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x, this.targetPosition.y+1));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x, this.targetPosition.y-1);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x, this.targetPosition.y-1));

    if (possiblePositions.length > 0) this.targetPosition = possiblePositions[parseInt(Math.random() * possiblePositions.length)];

    if (GLOBAL.tileManager.GetTileData(this.targetPosition.x, this.targetPosition.y) == 0)
    {
        GLOBAL.tileManager.GetTileIndexAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY, this.targetPosition);
    }

    GLOBAL.tileManager.GetTileWorldPosition(this.targetPosition.x, this.targetPosition.y, this.targetPosition);

    this.targetIsoPoint.setTo(this.targetPosition.x, this.targetPosition.y, 0);

    this.findDestinationHandler = null;

    this.creature.sprite.animations.play("run", 24, true);
};

GlassLab.CreatureStateIdle.prototype.Update = function()
{
    if (this.findDestinationHandler) return; // still waiting to pick a new destination

    var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.isoPosition);
    if (delta.getMagnitudeSq() > 1) {
      delta.setMagnitude(1);
    }
    else {
      // If the delta magnitude is less than our move speed, we're done after this frame.
      this.creature.sprite.animations.stop(null, true);
      this.creature.sprite.animations.frame = this.creature.standingFrame;
      this.findDestinationHandler = this.game.time.events.add(Math.random() * 3000 + 2000, this._findNewDestination, this);
      // Physics
      if (this.creature.sprite.body) {
        this.creature.sprite.body.velocity.setTo(0, 0);
        return;
      }
    }

    var debugPoint = this.game.iso.project(delta);
    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (debugPoint.x > 0 ? -1 : 1);

    if (this.creature.sprite.body) {
      // Physics
      this.creature.sprite.body.velocity.x = delta.x * 100.0;
      this.creature.sprite.body.velocity.y = delta.y * 100.0;
    }
    else {
      Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);

      //this.creature.sprite.position = delta;
      this.creature.sprite.isoX = delta.x;
      this.creature.sprite.isoY = delta.y;
    }

    debugPoint = this.game.iso.project(this.targetIsoPoint);
    this.creature.debugAILine.setTo(this.creature.sprite.x, this.creature.sprite.y, debugPoint.x, debugPoint.y);
};

/**
 * CreatureStateWaitingForFood
 */
GlassLab.CreatureStateWaitingForFood = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  // Do nothing
};

GlassLab.CreatureStateWaitingForFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingForFood.constructor = GlassLab.CreatureStateWaitingForFood;

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  console.log(this.creature,"dragged");
};

GlassLab.CreatureStateDragged.prototype.Update = function()
{
  console.log("update"); // TODO: why doesn't this get called??
  var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
  this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
    Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
  this.creature.sprite.isoX = cursorIsoPosition.x;
  this.creature.sprite.isoY = cursorIsoPosition.y;
};

GlassLab.CreatureStateDragged.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateDragged.constructor = GlassLab.CreatureStateDragged;

/**
 * CreatureStateWalkingToFood - moving to the next piece of food in the pen
 */
GlassLab.CreatureStateWalkingToFood = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.food = food;
  console.log(this.creature,"walking to food", food);
};

GlassLab.CreatureStateWalkingToFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWalkingToFood.constructor = GlassLab.CreatureStateWalkingToFood;

GlassLab.CreatureStateWalkingToFood.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.sprite.animations.play("run", 24, true);
};

GlassLab.CreatureStateWalkingToFood.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.sprite.animations.stop(null, true);
  this.creature.sprite.animations.frame = this.creature.standingFrame;
};

GlassLab.CreatureStateWalkingToFood.prototype.Update = function()
{
  var speed = 1;
  var delta = Phaser.Point.subtract(this.food.sprite.isoPosition, this.creature.sprite.isoPosition);
  if (delta.getMagnitudeSq() > Math.pow(GLOBAL.tileSize * 0.3, 2)) { // we're more than one step away
    delta.setMagnitude(speed);
    Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);
    this.creature.sprite.isoX = delta.x;
    this.creature.sprite.isoY = delta.y;
  }
  else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.food));
  }
};

/**
 * CreatureStateEating - chewing on some food
 */
GlassLab.CreatureStateEating = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  console.log(this.creature,"eating");
  this.food = food;
};

GlassLab.CreatureStateEating.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEating.constructor = GlassLab.CreatureStateEating;

GlassLab.CreatureStateEating.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.startTime = this.game.time.totalElapsedSeconds();
  this.startScaleY = this.creature.sprite.scale.y;
  this.tween = this.game.add.tween(this.creature.sprite.scale).to( {y: this.startScaleY * 0.9 }, 200, Phaser.Easing.Linear.InOut, true, 0, -1, true);
  this.tween2 = this.game.add.tween(this.food.sprite).to( {alpha: 0.1 },
    GlassLab.CreatureStateEating.EATING_TIME * 1000, Phaser.Easing.Linear.None, true);

};

GlassLab.CreatureStateEating.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
}

GlassLab.CreatureStateEating.EATING_TIME = 2; // in secs. This can be replaced by the length of the eating anim maybe

GlassLab.CreatureStateEating.prototype.Update = function()
{
  var timeElapsed = this.game.time.totalElapsedSeconds() - this.startTime;

  if (timeElapsed > GlassLab.CreatureStateEating.EATING_TIME) {
    this.food.sprite.visible = false;
    this.tween.stop();
    this.tween2.stop();
    this.creature.sprite.scale.y = this.startScaleY;
    this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature,
      this.creature.pen.GetNextFoodInCreatureRow(this.creature)));
  }
};

/**
 * CreatureStateVomiting - when it has eaten too much
 */
GlassLab.CreatureStateVomiting = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  // Do nothing
};

GlassLab.CreatureStateVomiting.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateVomiting.constructor = GlassLab.CreatureStateVomiting;