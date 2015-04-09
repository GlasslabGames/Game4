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
    this.creature.draggableComponent.active = true;

    this.originalSpeed = this.creature.moveSpeed;
    this.creature.moveSpeed += 1.5 + Math.random() * 2;

    this.creature.PathToIsoPosition(this.target.pos.x, this.target.pos.y);

    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creature.type);
    this.footstepSound = GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_footstep"+Math.floor(Math.random()*5.0), false, true);

    this.creature.onDestinationReached.add(this._onDestinationReached, this);
};

GlassLab.CreatureStateTraveling.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);

    this.creature.moveSpeed = this.originalSpeed;

    if (this.footstepSound) this.footstepSound.stop();

    this.creature.onDestinationReached.remove(this._onDestinationReached, this);
};

GlassLab.CreatureStateTraveling.prototype.Update = function() {
    this.creature._move(this.creature.moveSpeed);
};

GlassLab.CreatureStateTraveling.prototype._onDestinationReached = function(creature)
{
    //console.log("Destination reached! target:",this.target);
    this.creature.StopAnim();
    if (!this.creature.tryReachTarget(this.target)) { // we weren't able to enter our target for some reason, so look for a new one
        this.creature.lookForTargets();
    }
};