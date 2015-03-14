/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateTraveling - when it's heading for a certain target (for now, a target tile, although it could be reworked)
 */
GlassLab.CreatureStateTraveling = function(game, owner, targetTile)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.target = targetTile;
};

GlassLab.CreatureStateTraveling.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateTraveling.constructor = GlassLab.CreatureStateTraveling;

GlassLab.CreatureStateTraveling.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.creature.draggable = true;

    this.creature.PathToTile(this.target);

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
    this.creature.StopAnim();
    // If the waypoint is the same as the original target point, stop

    var creatureCurrentTile = this.creature.getTile();
    if (creatureCurrentTile.inPen && this.creature.tryEnterPen(creatureCurrentTile.inPen)) {
        // ok, we're in the pen
    } else if (creatureCurrentTile.food && this.creature.desiredAmountsOfFood[creatureCurrentTile.food.type]) {
        this.creature.eatFreeFood(creatureCurrentTile.food);
    } else {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this.creature));
    }
};