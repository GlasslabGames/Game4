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
    var delta = Phaser.Point.subtract(GlassLab.Util.GetGlobalIsoPosition(this.foodInfo.food.sprite), GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite));

    // When far, run
    if (delta.getMagnitudeSq() < GLOBAL.tileSize * GLOBAL.tileSize * 1.5625) // 1.5625 = 1.25^2, derived from when creatures leave this state and begin to eat food (.25 squares away)
    {
        this.speed = this.creature.moveSpeed - .25 + (Math.random() * 0.5); // adjust by +- 0.25
        this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
    }
    else
    {
        this.speed = this.creature.moveSpeed + 5; // adjust by +- 0.25
        this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
    }
    this.creature.draggable = false;

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
    var delta = Phaser.Point.subtract(GlassLab.Util.GetGlobalIsoPosition(this.foodInfo.food.sprite), GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite));
    var deltaMagSq = delta.getMagnitudeSq();
    if (deltaMagSq > Math.pow(GLOBAL.tileSize * 0.25, 2)) { // we're far from the carrot
        delta.setMagnitude(this.speed);
        Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);
        this.creature.sprite.isoX = delta.x;
        this.creature.sprite.isoY = delta.y;

        // When close and running, slow down
        if ( this.speed >= this.creature.moveSpeed + .5 && deltaMagSq - this.speed*this.speed < GLOBAL.tileSize * GLOBAL.tileSize * 1.5625)
        {
            this.speed = this.creature.moveSpeed - .25 + (Math.random() * 0.5); // adjust by +- 0.25
            this.creature.PlayAnim("walk", true, this.speed * this.creature.baseAnimSpeed);
        }
    }
    else {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
    }
    //this.creature._move(); // If we use pathing
};

/*
GlassLab.CreatureStateWalkingToFood.prototype._onDestinationReached = function(creature)
{
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.foodInfo));
};
*/
