/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWaitingForFood
 */
GlassLab.CreatureStateWaitingForFood = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  // Do nothing
};

GlassLab.CreatureStateWaitingForFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingForFood.constructor = GlassLab.CreatureStateWaitingForFood;

GlassLab.CreatureStateWaitingForFood.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.standFacing("right");
  this.creature.draggable = true;
};

GlassLab.CreatureStateWaitingForFood.prototype.StartWalkingToFood = function() {
  var food = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
  if (!food || !this.creature.desiredAmountsOfFood[food.type]) { // no good. Stop immediately, unsatisfied (unless this creature wanted 0 food?)
    if (this.creature.getIsSatisfied()) this.creature.FinishEating(true);
    else {
        if (food) {
            console.log(this.creature.print(), "is hungry but has no more food to target (in StartWalking). Eaten:", this.creature.foodEaten,
                "Desired:", this.creature.desiredAmountsOfFood[food.type]);
        }
      this.creature.FinishEating(false);
    }
  } else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, food));
  }
};