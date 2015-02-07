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
    console.log("Eating food. In pen?",this.food.pen);
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.anim = this.creature.PlayAnim("eat", false, 24);
    this.chomped = false;
    if (this.anim) {
        this.anim.onComplete.addOnce(this.StopEating, this);
    } else {
        this.StopEating();
    }
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
    this.creature.ShowHungerBar(true, this.food.type, !this.creature.pen); // if we're in the pen, keep the hunger bar up. Else show it briefly.
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
    console.log("Finished eating anim");
    if (!this.chomped) this._onChomp();

    this.creature.foodEaten[this.food.type] ++;
    var hungerRemaining = this.creature.desiredAmountsOfFood[this.food.type] - this.creature.foodEaten[this.food.type];
    console.log("hunger remaining: ", hungerRemaining);

    // Choose which state to go to based on the situation...
    if (hungerRemaining < 0) {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
    } else if (this.food.pen) { // continue to the next part of the pen
        var food = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
        if (food) {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, food));
        } else { // there's no more food
            // end the level hungry or satisfied
            this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
            if (!hungerRemaining) this.creature.FinishEating(true);
            else {
                console.log(this.creature.print(),"is hungry but has no more food to target (in StopEating.) Eaten:",
                    this.creature.foodEaten[this.food.type], "Desired:",this.creature.desiredAmountsOfFood[this.food.type]);
                this.creature.FinishEating(false);
            }
        }
    } else { // eating outside of pen, so just continue to the next target or go to idle
        if (!hungerRemaining) this.creature.Emote(true);
        this.creature._onTargetsChanged();
    }
};
