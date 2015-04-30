/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWaitingToEat - when a creature wants to eat some food, but they need to wait for the rest of the group to get there
 */
GlassLab.CreatureStateWaitingToEat = function(game, owner, foodInfo)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.foodInfo = foodInfo;
};

GlassLab.CreatureStateWaitingToEat.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingToEat.constructor = GlassLab.CreatureStateWaitingToEat;

GlassLab.CreatureStateWaitingToEat.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);

    var food = this.foodInfo.food;
    this.foodListener = food.onEnoughEaters.addOnce(this.eat, this);
    this.creature.standFacingPosition(food.getGlobalPos());

    if (!this.creature.pen) {
        this.timer = this.game.time.events.add(5000, this.stopWaiting, this); // only countdown if we're not in the pen
        this.timer2 = this.game.time.events.add(3000, function() {
            this.creature.thoughtBubble.show(null, GLOBAL.creatureManager.GetCreatureData(this.creature.type).spriteName+"_idle", 2000, null, null, 0.25);
        }, this); // only countdown if we're not in the pen
    }
    food.addEater(this.creature); // if it now has enough creatures around it, hasEnoughEaters will trigger
};

GlassLab.CreatureStateWaitingToEat.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);

    if (this.foodListener) this.foodListener.detach();
    if (this.timer) this.game.time.events.remove(this.timer);
    if (this.timer2) this.game.time.events.remove(this.timer2);

    this.creature.thoughtBubble.hide();
};

GlassLab.CreatureStateWaitingToEat.prototype.stopWaiting = function() {
    this.foodInfo.food.removeEater(this.creature);
    this.creature.lookForTargets();
};

GlassLab.CreatureStateWaitingToEat.prototype.eat = function() {
    console.log(this.creature.name,"eating");
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
};