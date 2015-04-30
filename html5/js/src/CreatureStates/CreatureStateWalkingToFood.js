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
    this.creature.draggableComponent.active = false;

    this.creature.sprite.scale.x = - Math.abs(this.creature.sprite.scale.x);

    // run ahead to the first food we want
    var run = false;
    var delta = Phaser.Point.subtract(this.foodInfo.food.getGlobalPos(), this.creature.getGlobalPos());
    run = (delta.getMagnitudeSq() >= GLOBAL.tileSize * GLOBAL.tileSize * 1.5625); // 1.5625 = 1.25^2, derived from when creatures leave this state and begin to eat food (.25 squares away))

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

        var info = this.foodInfo;
        var foodPos = info.food.getGlobalPos();

        // Adjust the target position depending on our position in the eating group.
        var eatBackwards = (info.groupSize && info.groupIndex >= info.groupSize / 2);
        if (eatBackwards) {
            foodPos.x += GLOBAL.tileSize * 0.25;
            if (Math.floor(info.groupSize / 2) % 2 == 0) { // even number of creatures eating on this side
                // checking if the group index is even will cause them to alternate higher and lower positions
                if (info.groupIndex % 2) foodPos.y += GLOBAL.tileSize * 0.25;
                else foodPos.y -= GLOBAL.tileSize * 0.25;
            }
        } else {
            foodPos.x -= GLOBAL.tileSize * 0.5;
            if (Math.ceil(info.groupSize / 2) % 2 == 0) { // even number of creatures eating on this side
                if (info.groupIndex % 2) foodPos.y += GLOBAL.tileSize * 0.25;
                else foodPos.y -= GLOBAL.tileSize * 0.25;
            }
        }
        this.foodInfo.eatBackwards = eatBackwards; // remember whether we want to face backwards when it's time to eat

        var delta = Phaser.Point.subtract(foodPos, this.creature.getGlobalPos());
        var deltaMagSq = delta.getMagnitudeSq();
        if (deltaMagSq > Math.pow(this.speed, 2)) { // we're still far from the food
            // check if we're too close to the creature in front. but if that creature is already finished eating, we have to be allowed to walk by them.
            if (this.creature.creatureInFront && !this.creature.creatureInFront.finishedEating) {
                var dist = Phaser.Point.subtract(this.creature.creatureInFront.getGlobalPos(), this.creature.getGlobalPos());
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
            Phaser.Point.add(this.creature.isoPosition, delta, delta);
            this.creature.isoX = delta.x;
            this.creature.isoY = delta.y;
        }
        else {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingToEat(this.game, this.creature, this.foodInfo));
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
