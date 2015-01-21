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

    this.debugAILine = new Phaser.Line();

    //game.physics.isoArcade.enable(this.sprite);
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
  this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
  GLOBAL.dragTarget = null;
};

GlassLab.Creature.prototype.OnStickyDrop = function() { // called by (atm) prototype.js
  this._endDrag();
}

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

/**
 * CreatureStateIdle
 */
GlassLab.CreatureStateIdle = function(game, owner)
{
    GlassLab.CreatureState.call(this, game, owner);

    this.targetPosition = new Phaser.Point();
    this.targetIsoPoint = new Phaser.Plugin.Isometric.Point3();
    this.findDestinationTimer = null;
    this.updateHandler = null;
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

    if (this.updateHandler)
    {
        this.updateHandler.detach();
        this.updateHandler = null;
    }

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
    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.creature.sprite.animations.play("run", 24, true);
};

GlassLab.CreatureStateIdle.prototype._onUpdate = function()
{
    var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.isoPosition);
    if (delta.getMagnitudeSq() > 1) {
      delta.setMagnitude(1);
    }
    else {
      // If the delta magnitude is less than our move speed, we're done after this frame.
      this.updateHandler.detach();
      this.updateHandler = null;
      this.creature.sprite.animations.stop(null, true);
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

GlassLab.CreatureStateWaitingForFood.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.draggable = false;
};

GlassLab.CreatureStateWaitingForFood.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
};

GlassLab.CreatureStateDragged.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);
};

GlassLab.CreatureStateDragged.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
  if (this.updateHandler)
  {
    this.updateHandler.detach();
    this.updateHandler = null;
  }
};

GlassLab.CreatureStateDragged.prototype._onUpdate = function()
{
  var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY+50);
  this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
  Phaser.Point.divide(cursorIsoPosition, this.game.world.scale, cursorIsoPosition);
  this.creature.sprite.isoX = cursorIsoPosition.x;
  this.creature.sprite.isoY = cursorIsoPosition.y;
}
