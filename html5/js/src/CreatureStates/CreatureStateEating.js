/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateEating - chewing on some food
 */
GlassLab.CreatureStateEating = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  //console.log(this.creature,"eating");
  this.food = food;
};

GlassLab.CreatureStateEating.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEating.constructor = GlassLab.CreatureStateEating;

GlassLab.CreatureStateEating.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.anim = this.creature.PlayAnim("eat", false, 48);
  this.chomped = false;
  this.anim.onComplete.addOnce(this.StopEating, this);
  this.creature.draggable = false;
};

GlassLab.CreatureStateEating.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateEating.prototype.Update = function() {
  if (!this.chomped && this.anim.frame >= 16) this._onChomp(); // this is the frame index where he chomps
};

GlassLab.CreatureStateEating.prototype._onChomp = function() {
  this.chomped = true;
  this.food.BeEaten();
  this.creature.ShowHungerBar(true);
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
  console.log("Finished eating anim");
  //this.food.sprite.visible = false;
  this.creature.foodEaten ++;

  // Choose which state to go to based on the situation...
  if (this.creature.foodEaten > this.creature.desiredAmountOfFood) {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
  } else {
    var food = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
    if (food) {
      this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, food));
    } else { // there's no more food
      // end the level hungry or satisfied
      this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
      var satisfied = (this.creature.foodEaten == this.creature.desiredAmountOfFood);
      if (satisfied) this.creature.FinishEating(true);
      else {
        console.log(this.creature.print(),"is hungry but has no more food to target (in StopEating.) Eaten:",this.creature.foodEaten,
          "Desired:",this.creature.desiredAmountOfFood);
        this.creature.FinishEating(false);
      }
    }
  }
};
