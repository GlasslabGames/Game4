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

    this.sprite.animations.add('run');

    this.debugAILine = new Phaser.Line();
};

GlassLab.Creature.prototype._onUp = function(sprite, pointer)
{
    if (this.draggable) {
      this.sprite.animations.stop(null, true);
      this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
    }
};

GlassLab.Creature.prototype._onDown = function(sprite, pointer)
{
    if (this.draggable) {
      this.sprite.animations.stop(null, true);
      this.sprite.animations.play("run", 96, true);
      this.StateTransitionTo(null);
    }
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

GlassLab.CreatureState.prototype.Enter = function() { console.log("Enter"); };

GlassLab.CreatureState.prototype.Exit = function() { console.log("Exit"); };

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
    this.targetPosition.set(Math.random()*100.0 + 100.0, 0);
    this.targetPosition.rotate(0,0, Math.random() * Math.PI * 2);
    if (Math.random() > 0.5)
    {
        this.targetPosition.y = 0;
    }
    else
    {
        this.targetPosition.x = 0;
    }
    this.targetPosition.add(this.creature.sprite.isoX, this.creature.sprite.isoY);
    this.targetPosition.x = Math.round(this.targetPosition.x / GLOBAL.tileSize) * GLOBAL.tileSize;
    this.targetPosition.y = Math.round(this.targetPosition.y / GLOBAL.tileSize) * GLOBAL.tileSize;
    this.targetIsoPoint.setTo(this.targetPosition.x, this.targetPosition.y, 0);

    this.findDestinationHandler = null;
    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.creature.sprite.animations.play("run", 24, true);
};

GlassLab.CreatureStateIdle.prototype._onUpdate = function()
{
    var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.isoPosition);
    if (delta.getMagnitudeSq() > 1)
    {
        delta.setMagnitude(1);
    }
    else
    {
        // If the delta magnitude is less than our move speed, we're done after this frame.
        this.updateHandler.detach();
        this.updateHandler = null;
        this.creature.sprite.animations.stop(null, true);
        this.findDestinationHandler = this.game.time.events.add(Math.random()*3000 + 2000, this._findNewDestination, this);
    }
    if (Math.abs(delta.x) > Math.abs(delta.y))
        delta.y = 0;
    else delta.x = 0;

    var debugPoint = this.game.iso.project(delta);

    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (debugPoint.x > 0 ? -1 : 1);
    Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);

    //this.creature.sprite.position = delta;
    this.creature.sprite.isoX = delta.x;
    this.creature.sprite.isoY = delta.y;

    debugPoint = this.game.iso.project(this.targetIsoPoint);
    this.creature.debugAILine.setTo(this.creature.sprite.x, this.creature.sprite.y, debugPoint.x, debugPoint.y);

    //this.game.debug.geom(this.creature.debugAILine);
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