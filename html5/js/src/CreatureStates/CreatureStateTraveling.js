/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateTraveling - when it's heading for a certain target
 */
GlassLab.CreatureStateTraveling = function(game, owner, target)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.originalSpeed = this.creature.moveSpeed;
    this.target = target;
};

GlassLab.CreatureStateTraveling.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateTraveling.constructor = GlassLab.CreatureStateTraveling;

GlassLab.CreatureStateTraveling.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.creature.draggableComponent.setActive(true);

    this.originalSpeed = this.creature.moveSpeed;
    this.creature.moveSpeed += 1.5 + Math.random() * 2;

    this.creature.onDestinationReached.add(this._onDestinationReached, this);

    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creature.type);
    this.footstepSound = GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_footstep"+Math.floor(Math.random()*5.0), false, true);

    // This might send the onDestinationReached signal, so must be called after signal handler is called.
    this.creature.PathToIsoPosition(this.target.pos.x, this.target.pos.y);
};

GlassLab.CreatureStateTraveling.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);

    this.creature.moveSpeed = this.originalSpeed;

    if (this.footstepSound) this.footstepSound.stop();

    this.creature.StopAnim();

    this.creature.onDestinationReached.remove(this._onDestinationReached, this);
};

GlassLab.CreatureStateTraveling.prototype.Update = function() {
    this.creature._move(this.creature.moveSpeed);
};

GlassLab.CreatureStateTraveling.prototype._onDestinationReached = function(creature)
{
    this.creature.StopAnim();

    if (this.footstepSound) this.footstepSound.stop();

    if (this.target.pos) this.creature.setIsoPos(this.target.pos.x, this.target.pos.y); // TODO: make the creature actually stop at the target point instead of on a tile.
    if (!this.creature.tryReachTarget(this.target)) { // we weren't able to enter our target for some reason, so look for a new one
        //this.creature.lookForTargets(); // This causes an infinite loop because lookForTargets() may attempt to reach the same point that it just failed at reaching.
    }
};