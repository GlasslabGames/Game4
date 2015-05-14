/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateWaitingInPen - the state previously known as CreatureStateWaitingForFood
 */
GlassLab.CreatureStateWaitingInPen = function(game, owner, afterEating)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.afterEating = afterEating;
};

GlassLab.CreatureStateWaitingInPen.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingInPen.constructor = GlassLab.CreatureStateWaitingInPen;

GlassLab.CreatureStateWaitingInPen.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.creature.standFacing("right");
    this.creature.draggableComponent.active = !this.afterEating && (!this.creature.pen || this.creature.pen instanceof GlassLab.FeedingPen); // you can drag them out of the pen before you start feeding them, but not after they're done
    this.foodTypesChangedHandler = GlassLab.SignalManager.penFoodTypeSet.add(this._onFoodTypeChanged, this);
};

GlassLab.CreatureStateWaitingInPen.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);
    this.foodTypesChangedHandler.detach();
};

GlassLab.CreatureStateWaitingInPen.prototype.StartWalkingToFood = function() {
    this.creature.pen.setCreatureStartedEating(this);
    this.creature.tryWalkToNextFood(); // this will handle the result if there is no more food, etc
};

GlassLab.CreatureStateWaitingInPen.prototype._onFoodTypeChanged = function(pen, food) {
    if (this.creature.pen != pen) return;
    if (!(food in this.creature.desiredAmountsOfFood)) {
        this.creature.thoughtBubble.show("redX", GlassLab.FoodTypes[food].spriteName, 1000);
    }
};
