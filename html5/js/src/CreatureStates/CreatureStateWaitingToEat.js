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

    this.creature.draggableComponent.setActive( !this.creature.pen ); // don't allow dragging creatures in the pen, but do allow dragging them outside the pen

    var food = this.foodInfo.food;
    this.foodListener = food.onEnoughEaters.addOnce(this.eat, this);
    this.creature.standFacingPosition(food.getGlobalPos());

    if (!this.creature.pen) {
        var t = Math.random() * 2000 + 4000;
        this.timer = this.game.time.events.add(t, this.stopWaiting, this); // only countdown if we're not in the pen
        this.timer2 = this.game.time.events.add(t - 2000, function() {
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

    // we might consider hiding the thoughtbubble now, but it caused issues (I think because a different thoughtbubble
};

GlassLab.CreatureStateWaitingToEat.prototype.stopWaiting = function() {
    this.foodInfo.food.removeEater(this.creature);
    this.creature.lookForTargets();
};

GlassLab.CreatureStateWaitingToEat.prototype.eat = function() {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
};