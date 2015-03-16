/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateTraveling - when it's heading for a certain target
 */
GlassLab.CreatureStateTraveling = function(game, owner, target)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.target = target;
};

GlassLab.CreatureStateTraveling.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateTraveling.constructor = GlassLab.CreatureStateTraveling;

GlassLab.CreatureStateTraveling.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.creature.draggable = true;

    this.creature.PathToIsoPosition(this.target.pos.x, this.target.pos.y);

    this.footstepSound = GLOBAL.audioManager.playSound("footsteps", true, true);

    this.creature.onDestinationReached.add(this._onDestinationReached, this);
};

GlassLab.CreatureStateTraveling.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);

    if (this.footstepSound) this.footstepSound.stop();

    this.creature.onDestinationReached.remove(this._onDestinationReached, this);
};

GlassLab.CreatureStateTraveling.prototype.Update = function() {
    this.creature._move();
};

GlassLab.CreatureStateTraveling.prototype._onDestinationReached = function(creature)
{
    console.log("Destination reached! target:",this.target);
    this.creature.StopAnim();
    if (this.target.pen && this.creature.tryEnterPen(this.target.pen)) {
        // ok, we're in the pen
    } else if (this.target.food && this.target.food.type in this.creature.desiredAmountsOfFood) {
        this.creature.eatFreeFood(this.target.food);
    } else {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this.creature));
    }
};