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
GlassLab.Creature = function(game, typeName)
{
    //this.sprite = game.make.isoSprite(0,0, typeName);
    this.sprite = game.make.sprite(0,0, typeName);
    this.game = game;
    this.state = null;

    this.StateTransitionTo(new GlassLab.CreatureStateIdle(game, this));

    this.sprite.inputEnabled = true;
    this.sprite.events.onInputUp.add(this._onUp, this);
    this.sprite.events.onInputDown.add(this._onDown, this);
    this.sprite.anchor.x = this.sprite.anchor.y = .5;

    this.sprite.animations.add('run');

    this.debugAILine = new Phaser.Line();
};

GlassLab.Creature.prototype._onUp = function(sprite, pointer)
{
    this.sprite.animations.stop(null, true);
    this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
};

GlassLab.Creature.prototype._onDown = function(sprite, pointer)
{
    this.sprite.animations.stop(null, true);
    this.sprite.animations.play("run", 96, true);
    this.StateTransitionTo(null);
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
    this.findDestinationTimer = null;
    this.updateHandler = null;
};

GlassLab.CreatureStateIdle.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateIdle.constructor = GlassLab.CreatureStateIdle;

GlassLab.CreatureStateIdle.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);

    this.findDestinationHandler = this.game.time.events.add(Math.random()*3000 + 2000, this._findNewDestination, this);
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
    this.targetPosition.rotate(0,0, ((Math.random() - 0.5) * Math.PI / 2.0 ) + (Math.random() < .5 ? 0 : Math.PI));
    this.targetPosition.add(this.creature.sprite.x, this.creature.sprite.y);
    this.targetPosition.x = Math.round(this.targetPosition.x);
    this.targetPosition.y = Math.round(this.targetPosition.y);

    this.findDestinationHandler = null;
    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.creature.sprite.animations.play("run", 24, true);
};

GlassLab.CreatureStateIdle.prototype._onUpdate = function()
{
    var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.position);
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

    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (delta.x > 0 ? -1 : 1);
    Phaser.Point.add(this.creature.sprite.position, delta, delta);
    this.creature.sprite.position = delta;

    this.creature.debugAILine.setTo(this.creature.sprite.x, this.creature.sprite.y, this.targetPosition.x, this.targetPosition.y);

    this.game.debug.geom(this.creature.debugAILine);
};