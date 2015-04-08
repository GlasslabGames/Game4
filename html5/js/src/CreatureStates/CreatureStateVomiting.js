/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateVomiting - when it has eaten too much
 */
GlassLab.CreatureStateVomiting = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.food = food;
};

GlassLab.CreatureStateVomiting.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateVomiting.constructor = GlassLab.CreatureStateVomiting;

GlassLab.CreatureStateVomiting.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.anim = this.creature.PlayAnim("vomit", false, this.creature.baseAnimSpeed, true);
  if (this.anim) this.anim.onComplete.addOnce(this._onFinishVomiting, this);
    else this._onFinishVomiting();
  this.spewed = false;
  this.creature.draggableComponent.draggable = false;

    this.spewFrame = GLOBAL.creatureManager.creatureDatabase[this.creature.type].fxFrames.vomit;
};

GlassLab.CreatureStateVomiting.prototype.Update = function() {
  if (!this.spewed && this.anim.frame >= this.spewFrame) this._onSpew(); // this is the frame index where we should start the vomit fx
};

GlassLab.CreatureStateVomiting.prototype._onSpew = function() {
  this.spewed = true;
  var vomit = this.game.make.isoSprite(0,0,0, "vomit");
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

GlassLab.CreatureStateVomiting.prototype._onVomitAnimEnded = function(vomit) {
  GLOBAL.foodLayer.addChild(vomit); // move it to the food layer (behind the creature)
  var tween = this.game.add.tween(vomit).to( { alpha: 0 }, 3000, "Linear", true);
  tween.onComplete.add( function() {this.destroy();}, vomit);
};

GlassLab.CreatureStateVomiting.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateVomiting.prototype._onFinishVomiting = function() {
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