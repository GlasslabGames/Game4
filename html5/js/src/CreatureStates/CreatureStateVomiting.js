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
  vomit.tint = 0xe37f54; // carrot color - if we don't want it so bright, use 0x9dad62
  this.creature.sprite.addChild(vomit); // NOTE: remember to clean this up if we do something except remove the parent
  vomit.animations.add("anim");
  vomit.animations.play("anim", 24, false);
};

GlassLab.CreatureStateVomiting.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateVomiting.prototype._onFinishVomiting = function() {
  this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
  console.log(this.creature.print(),"ate too much! Eaten:",this.creature.foodEaten, "Desired:",this.creature.desiredAmountOfFood);
  this.creature.FinishEating(false);
};