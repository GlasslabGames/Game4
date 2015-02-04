/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWalkingToFood - moving to the next piece of food in the pen
 */
GlassLab.CreatureStateWalkingToFood = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.food = food;
};

GlassLab.CreatureStateWalkingToFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWalkingToFood.constructor = GlassLab.CreatureStateWalkingToFood;

GlassLab.CreatureStateWalkingToFood.prototype.Enter = function()
{
  //console.log(this.creature,"walking to food", this.food);
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.PlayAnim("walk", true);
  this.creature.draggable = false;
  this.speed = 1.25 + (Math.random() * 0.5);
};

GlassLab.CreatureStateWalkingToFood.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.StopAnim();
};

GlassLab.CreatureStateWalkingToFood.prototype.Update = function()
{
  var delta = Phaser.Point.subtract(this.food.getGlobalIsoPos(), this.creature.getGlobalIsoPos());
  if (delta.getMagnitudeSq() > Math.pow(GLOBAL.tileSize * 0.5, 2)) { // we're far from the carrot
    delta.setMagnitude(this.speed);
    Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);
    this.creature.sprite.isoX = delta.x;
    this.creature.sprite.isoY = delta.y;
  }
  else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.food));
  }
};
