/**
 * Created by Rose Abernathy on 4/8/2015.
 */
/**
 * CreatureStatePooping - when it has eaten too much
 */
GlassLab.CreatureStatePooping = function(game, owner)
{
    GlassLab.CreatureState.call(this, game, owner);
};

GlassLab.CreatureStatePooping.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStatePooping.constructor = GlassLab.CreatureStatePooping;

GlassLab.CreatureStatePooping.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
    this.pooped = false;
    // Put in the pooping anim
  /*this.anim = this.creature.PlayAnim("vomit", false, this.creature.baseAnimSpeed, true);
  if (this.anim) this.anim.onComplete.addOnce(this._onFinishVomiting, this);
    else this._onFinishVomiting(); */

    this.creature.draggableComponent.active = false;
    this.poopFrame = GLOBAL.creatureManager.creatureDatabase[this.creature.type].fxFrames.vomit; // TODO
};

GlassLab.CreatureStatePooping.prototype.Update = function() {
  if (!this.poop && this.anim && this.anim.frame >= this.poopFrame) this._onPoop(); // this is the frame index where we should start the vomit fx
};

GlassLab.CreatureStatePooping.prototype._onPoop = function() {
  this.poop = true;
  var poop = new GlassLab.Poo(this.game);
  vomit.anchor.set(1,0);
  vomit.tint = this.creature.lastEatenFoodInfo? this.creature.lastEatenFoodInfo.color : 0xBFDB9A; // default vomit color
  GLOBAL.effectLayer.addChild(vomit); // NOTE: remember to clean this up if we do something except remove the parent
  vomit.scale.setTo(this.creature.sprite.scale.x, this.creature.sprite.scale.y);
    var globalPos = this.creature.getGlobalPos();
  vomit.isoX = globalPos.x;
  vomit.isoY = globalPos.y;
    if (this.creature.sprite.scale.x > 0) {
        vomit.isoX -= 50;
        vomit.isoY -= 70;
    } else {
        vomit.isoX -= 70;
        vomit.isoY -= 50;
    }
  vomit.animations.add("anim");
  vomit.animations.play("anim", this.creature.baseAnimSpeed, false);
  vomit.events.onAnimationComplete.add(this._onVomitAnimEnded, vomit);

    // if (this is on screen) // TODO
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creature.type);
    this.footstepSound = GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_throwup");
};

GlassLab.CreatureStatePooping.prototype._onVomitAnimEnded = function(vomit) {
  GLOBAL.foodLayer.addChild(vomit); // move it to the food layer (behind the creature)
  var tween = this.game.add.tween(vomit).to( { alpha: 0 }, 3000, "Linear", true);
  tween.onComplete.add( function() {this.destroy();}, vomit);
};

GlassLab.CreatureStatePooping.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStatePooping.prototype._onFinishVomiting = function() {
    if (this.creature.pen) {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateCry(this.game, this.creature, Number.MAX_VALUE));
        this.creature.FinishEating("sick");
    } else {
        this.creature.resetFoodEaten();
        if (this.food) { // only start crying if we had food, which means we're not just purging before entering a pen
            this.creature.StateTransitionTo(new GlassLab.CreatureStateCry(this.game, this.creature, 3000));
        } else { // else we were probably about to enter a pen, so look for it again
            this.creature.lookForTargets();
        }
    }
};