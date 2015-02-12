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
  this.anim = this.creature.PlayAnim("vomit", false, 24);
  this.anim.onComplete.addOnce(this._onFinishVomiting, this);
  this.spewed = false;
  this.creature.draggable = false;
};

GlassLab.CreatureStateVomiting.prototype.Update = function() {
  if (!this.spewed && this.anim.frame >= 51) this._onSpew(); // this is the frame index where we should start the vomit fx
};

GlassLab.CreatureStateVomiting.prototype._onSpew = function() {
  this.spewed = true;
  var vomit = this.game.make.sprite(-20,-190, "vomit"); //-420,-155
  vomit.anchor.set(1,0);
  vomit.tint = this.food.info.color;
  GLOBAL.effectLayer.addChild(vomit); // NOTE: remember to clean this up if we do something except remove the parent
  vomit.scale.setTo(this.creature.sprite.scale.x, this.creature.sprite.scale.y);
  vomit.x = this.creature.sprite.x;
  vomit.y = this.creature.sprite.y - 45;
  vomit.animations.add("anim");
  vomit.animations.play("anim", 24, false);
  vomit.events.onAnimationComplete.add(this._onVomitAnimEnded, vomit);
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
  if (this.creature.pen) { // assume it was eating in the pen... this should be revised to avoid weird corner cases
    this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
    this.creature.FinishEating(false);
  } else {
    this.creature.Emote(false);
    this.creature.resetFoodEaten();
    this.creature._onTargetsChanged();
  }
};