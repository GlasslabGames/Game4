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
    this.creature.draggableComponent.active = !this.afterEating && (!this.creature.pen || this.creature.pen.penStyle != GlassLab.Pen.STYLES.crate); // you can drag them out of the pen before you start feeding them, but not after they're done
    this.foodTypesChangedHandler = GlassLab.SignalManager.penFoodTypeSet.add(this._onFoodTypeChanged, this);
};

GlassLab.CreatureStateWaitingForFood.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);
    this.foodTypesChangedHandler.detach();
};

GlassLab.CreatureStateWaitingForFood.prototype.StartWalkingToFood = function() {
    this.creature.tryWalkToNextFood(); // this will handle the result if there is no more food, etc
};

GlassLab.CreatureStateWaitingForFood.prototype._onFoodTypeChanged = function(pen, food) {
    if (this.creature.pen != pen) return;
    if (!(food in this.creature.desiredAmountsOfFood)) {
        this.creature.thoughtBubble.show("redX", GlassLab.FoodTypes[food].spriteName, 1000);
    }
};
