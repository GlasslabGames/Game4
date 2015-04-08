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
    this.creature.draggableComponent.draggable = false;

    // as long as we don't eat fractional food, run ahead to the first food we want (it's just too confusing with fractional food)
    var run = false;
    if (!GLOBAL.creatureManager.getCreatureWantsFractionalFood(this.creature.type)) {
        var delta = Phaser.Point.subtract(this.foodInfo.food.getGlobalPos(), GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite));
        run = (delta.getMagnitudeSq() >= GLOBAL.tileSize * GLOBAL.tileSize * 1.5625); // 1.5625 = 1.25^2, derived from when creatures leave this state and begin to eat food (.25 squares away))
    }

    // When far, run
    if (!run)
    {
        this.speed = this.creature.moveSpeed - .25 + (Math.random() * 0.5); // adjust by +- 0.25
        this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
    }
    else {
        this.speed = this.creature.moveSpeed + 5; // adjust by +- 0.25
        this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
    }

    /* If we use pathing for this - currently it looks weird and blocks the game if the pen goes into the water
    this.creature.PathToTile(this.foodInfo.food.getTile());
    this.creature.onDestinationReached.add(this._onDestinationReached, this);
    */
};

GlassLab.CreatureStateWalkingToFood.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);
    this.creature.StopAnim();

    // this.creature.onDestinationReached.remove(this._onDestinationReached, this);
};

GlassLab.CreatureStateWalkingToFood.prototype.Update = function()
{
    if (this.delayCountdown > 0) {
        this.delayCountdown--;
    } else {
        if (this.stopped) {
            this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
            this.stopped = false;
        }
        var delta = Phaser.Point.subtract(this.foodInfo.food.getGlobalPos(), GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite));
        var deltaMagSq = delta.getMagnitudeSq();
        if (deltaMagSq > Math.pow(GLOBAL.tileSize * 0.25, 2)) { // we're still far from the food
            // check if we're too close to the creature in front. but if that creature is already finished eating, we have to be allowed to walk by them.
            if (this.creature.creatureInFront && !this.creature.creatureInFront.finishedEating) {
                var dist = Phaser.Point.subtract(GlassLab.Util.GetGlobalIsoPosition(this.creature.creatureInFront.sprite), GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite));
                if (dist.getMagnitudeSq() < Math.pow(GLOBAL.tileSize * 0.75, 2)) { // too close to the creature in front, so wait for it to advance
                    this.delayCountdown = 50; // wait a while before trying to move forward again
                    this.creature.StopAnim();
                    this.stopped = true;
                    return;
                }
            }

            // When close and running, slow down
            if ( this.speed >= this.creature.moveSpeed + .5 && deltaMagSq - this.speed*this.speed < GLOBAL.tileSize * GLOBAL.tileSize * 1.5625)
            {
                this.speed = this.creature.moveSpeed - .25 + (Math.random() * 0.5); // adjust by +- 0.25
                this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
            }

            delta.setMagnitude(this.speed);
            Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);
            this.creature.sprite.isoX = delta.x;
            this.creature.sprite.isoY = delta.y;
        }
        else {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
        }
        //this.creature._move(); // If we use pathing
    }
};

/*
GlassLab.CreatureStateWalkingToFood.prototype._onDestinationReached = function(creature)
{
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
};
*/
