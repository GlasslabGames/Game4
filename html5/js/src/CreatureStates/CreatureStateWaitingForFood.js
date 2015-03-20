/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWaitingForFood
 */
GlassLab.CreatureStateWaitingForFood = function(game, owner, afterEating)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.afterEating = afterEating;
};

GlassLab.CreatureStateWaitingForFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingForFood.constructor = GlassLab.CreatureStateWaitingForFood;

GlassLab.CreatureStateWaitingForFood.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.standFacing("right");
  this.creature.draggable = !this.afterEating; // you can drag them out of the pen before you start feeding them, but not after they're done
    this.foodTypesChangedHandler = GlassLab.SignalManager.penFoodTypeSet.add(this._onFoodTypeChanged, this);
};

GlassLab.CreatureStateWaitingForFood.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);
    this.foodTypesChangedHandler.detach();
};

GlassLab.CreatureStateWaitingForFood.prototype.StartWalkingToFood = function() {
  var foodInfo = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
  if (!foodInfo || !this.creature.desiredAmountsOfFood[foodInfo.food.type]) { // no good. Stop immediately, unsatisfied (unless this creature wanted 0 food?)
    if (this.creature.getIsSatisfied()) this.creature.FinishEating("satisfied");
    else {
        if (foodInfo) {
            console.log(this.creature.print(), "is hungry but has no more food to target (in StartWalking). Eaten:", this.creature.foodEaten,
                "Desired:", this.creature.desiredAmountsOfFood[foodInfo.food.type]);
        }
      this.creature.FinishEating("hungry");
    }
  } else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, foodInfo));
  }
};

GlassLab.CreatureStateWaitingForFood.prototype._onFoodTypeChanged = function(pen, food) {
    if (this.creature.pen != pen) return;
    if (!(food in this.creature.desiredAmountsOfFood)) {
        this.creature.thoughtBubble.show("redX", GlassLab.FoodTypes[food].spriteName, 1000);
    }
};
