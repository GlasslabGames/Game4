/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateEating - chewing on some food
 */
GlassLab.CreatureStateEating = function(game, owner, foodInfo)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.eatPartially = foodInfo.eatPartially;
    this.food = foodInfo.food;
};

GlassLab.CreatureStateEating.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEating.constructor = GlassLab.CreatureStateEating;

GlassLab.CreatureStateEating.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.anim = this.creature.PlayAnim("eat", false, 24);
    this.chomped = false;
    if (this.anim) {
        this.anim.onComplete.addOnce(this.StopEating, this);
    } else {
        this.StopEating();
    }
    this.creature.draggable = false;

    var info = GLOBAL.creatureManager.creatureDatabase[this.creature.type];
    this.chompFrame = info.fxFrames.eat;
    if (info.eatFxStyle) this.food.setAnimStyle(info.eatFxStyle[this.food.type]);

    this.amountToEat = 1;
    if (this.eatPartially) {
        this.amountToEat = this.creature.desiredAmountsOfFood[this.food.type] % 1;
    }
};

GlassLab.CreatureStateEating.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateEating.prototype.Update = function() {
    if (!this.chomped && this.anim.frame >= this.chompFrame) this._onChomp(); // this is the frame index where he chomps
};

GlassLab.CreatureStateEating.prototype._onChomp = function() {
    this.chomped = true;
    this.amountEaten = this.food.BeEaten(this.amountToEat);
    this.creature.ShowHungerBar(this.amountEaten, this.food.type, !this.creature.pen); // if we're in the pen, keep the hunger bar up. Else show it briefly.
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
    if (!this.chomped) this._onChomp();

    this.creature.foodEaten[this.food.type] += this.amountEaten;

    // Choose which state to go to based on the situation...
    if (this.creature.getIsSick()) {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
    } else if (this.food.pen) { // continue to the next part of the pen
        var foodInfo = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
        if (foodInfo && foodInfo.food && this.creature.desiredAmountsOfFood[foodInfo.food.type]) {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, foodInfo));
        } else { // there's no more food
            // end the level hungry or satisfied
            this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
            if (this.creature.getIsSatisfied()) this.creature.FinishEating("satisfied");
            else {
                this.creature.FinishEating("hungry");
            }
        }
    } else { // eating outside of pen, so just continue to the next target or go to idle
        if (this.creature.getIsSatisfied())
        {
            GlassLab.SignalManager.creatureFed.dispatch(this.creature);
            this.creature.Emote(true);
        }
        this.creature._onTargetsChanged();
    }
};
