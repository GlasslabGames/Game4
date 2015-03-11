/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWalkingToFood - moving to the next piece of food in the pen
 */
GlassLab.CreatureStateWalkingToFood = function(game, owner, foodInfo)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.foodInfo = foodInfo;
};

GlassLab.CreatureStateWalkingToFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWalkingToFood.constructor = GlassLab.CreatureStateWalkingToFood;

GlassLab.CreatureStateWalkingToFood.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.speed = this.creature.moveSpeed - 0.25 + (Math.random() * 0.5); // adjust by +- 0.25
    this.creature.draggable = false;
    this.creature.PathToTile(this.foodInfo.food.getTile());

    this.creature.onDestinationReached.add(this._onDestinationReached, this);
};

GlassLab.CreatureStateWalkingToFood.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.StopAnim();

    this.creature.onDestinationReached.remove(this._onDestinationReached, this);
};

GlassLab.CreatureStateWalkingToFood.prototype.Update = function()
{
    this.creature._move();
};

GlassLab.CreatureStateWalkingToFood.prototype._onDestinationReached = function(creature)
{
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
};
