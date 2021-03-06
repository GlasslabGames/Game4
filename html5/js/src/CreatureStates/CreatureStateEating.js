/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateEating - chewing on some food
 * @param foodInfo may optionally contain foodInfo.reaction, in which case, the food consumption is handled differently than desiredFood
 */
GlassLab.CreatureStateEating = function(game, owner, foodInfo)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.eatBackwards = foodInfo.eatBackwards;
    this.food = foodInfo.food;
    if (typeof(foodInfo.reaction) != "undefined")
        this.altReactionToFood = foodInfo.reaction;
    else
        this.altReactionToFood = null;
};

GlassLab.CreatureStateEating.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEating.constructor = GlassLab.CreatureStateEating;

GlassLab.CreatureStateEating.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);

    if (!this.food.pen || this.eatBackwards) { // eating in the wild or we need to face backwards towards the food
        var dir = this.creature.standFacingPosition(this.food.getGlobalPos());
        if (dir == "up" || dir == "left") this.eatBackwards = true; // catch the case where they need to eat backwards outside the pen
    }

    this.chomped = false;

    if (this.eatBackwards && !("eat_back" in this.creature.animSprites)) {
        // bounce instead of animating
        var tween = this.game.make.tween(this.creature.sprite.scale).to({y: this.creature.spriteScaleY * 0.9}, 200, Phaser.Easing.Sinusoidal.InOut, true, 0, 4, true);
        tween.onLoop.addOnce(this._onChomp, this);
        tween.onComplete.addOnce(this.StopEating, this);
    } else {
        if (this.food.pen) this.creature.sprite.scale.x = - Math.abs(this.creature.sprite.scale.x);

        var animName = (this.eatBackwards? "eat_back" : "eat");
        this.anim = this.creature.PlayAnim(animName, false, this.creature.baseAnimSpeed, true); // restart if we were playing an eat anim
        if (this.anim) {
            this.anim.onComplete.addOnce(this.StopEating, this);
        } else {
            this.StopEating();
        }
    }

    this.creature.draggableComponent.setActive(false);

    var info = GLOBAL.creatureManager.creatureDatabase[this.creature.type];
    this.chompFrame = info.fxFrames.eat;
    this.eatFxStyle = info.eatFxStyle || "short";
};

GlassLab.CreatureStateEating.prototype.Exit = function() {
    GlassLab.CreatureState.prototype.Exit.call(this);
    if (this.anim) this.anim.onComplete.remove(this.StopEating, this); // clean up a pending event if necessary
};

GlassLab.CreatureStateEating.prototype.Update = function() {
    if (!this.chomped && this.anim && this.anim.frame >= this.chompFrame) this._onChomp(); // this is the frame index where he chomps
};

GlassLab.CreatureStateEating.prototype._onChomp = function() {
    this.chomped = true;

    // audio:
    // if (this is on screen) // TODO
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creature.type);
    GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_eat");

    if (!this.food || this.food.game == null)
    {
        console.error("Creature ate food that doesn't exist!");
        return;
    }
    this.amountEaten = this.food.BeEaten(this.eatFxStyle);
    this.creature.lastEatenFoodInfo = this.food.info;

    // show hunger bar if food is desirable:
    if (this.altReactionToFood == null) {
        var hideBarAfter = (this.creature.pen? null : 2); // if we're in the pen, keep the hunger bar up. Else show it briefly.
        this.creature.ShowHungerBar(this.amountEaten, this.food.type, hideBarAfter);
    }
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
    if (!this.active) return; // catch a weird case where this gets called after we've left the state

    if (!this.chomped) this._onChomp();

    this.creature.foodEaten[this.food.type] += this.amountEaten;

    // Perform various actions based on food eaten:
    if (this.altReactionToFood == null) {
        // normal desiredFood consumption:
        GlassLab.SignalManager.creatureEats.dispatch(this.creature);

        // just check if ate too much:
        if (this.creature.getIsSick()) {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
            return; // do no more after vomiting
        }
    } else {
        // ate "other" food: do specific things based on this.altReactionToFood
        if (this.altReactionToFood.result == "sick") {
            this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
            return; // do no more after vomiting
        }
        else if (this.altReactionToFood.result == "hyper") {
            // update creature's moveSpeed and continue....

            this.creature.StateTransitionTo(new GlassLab.CreatureStateCrazyRun(this.game, this.creature, 15000));
            //this.creature.moveSpeed = this.altReactionToFood.details.speedMultiplier * this.creature.normalMoveSpeed;

            return;
        }
    }

    // Choose what to do based on location (in or out of pen):
    if (this.creature.pen) { // continue to the next part of the pen
        this.creature.tryWalkToNextFood();
    } else { // eating outside of pen, so just continue to the next target or go to idle
        if (this.creature.getIsSatisfied())
        {
            GlassLab.SignalManager.creatureFed.dispatch(this.creature);
            this.creature.showEmote(true);
            GLOBAL.creatureManager.LogNumCreaturesFed(this.creature.type, 1);
        }
        this.creature.startPoopTimer(); // we want to poop a little while after we eat
        this.creature.lookForTargets();
    }
};
