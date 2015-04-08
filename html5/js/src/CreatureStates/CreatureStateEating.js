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
    this.anim = this.creature.PlayAnim("eat", false, this.creature.baseAnimSpeed, true); // restart if we were playing an eat anim
    this.chomped = false;
    if (this.anim) {
        this.anim.onComplete.addOnce(this.StopEating, this);
    } else {
        this.StopEating();
    }
    this.creature.draggableComponent.draggable = false;

    var info = GLOBAL.creatureManager.creatureDatabase[this.creature.type];
    this.chompFrame = info.fxFrames.eat;
    if (info.eatFxStyle) this.food.setAnimStyle(info.eatFxStyle);

    this.amountToEat = 1;
    if (this.eatPartially) {
        this.amountToEat = this.creature.desiredAmountsOfFood[this.food.type] % 1;
    }

    if (!this.food.pen) { // eating in the wild
        // switch direction
        if (this.food.getGlobalPos() < GlassLab.Util.GetGlobalIsoPosition(this.creature.sprite)) this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x);
        else this.creature.sprite.scale.x = - Math.abs(this.creature.sprite.scale.x);
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
    this.creature.lastEatenFoodInfo = this.food.info;
    var hideBarAfter = (this.creature.pen? null : 2); // if we're in the pen, keep the hunger bar up. Else show it briefly.
    this.creature.ShowHungerBar(this.amountEaten, this.food.type, hideBarAfter);
    // if (this is on screen) // TODO
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creature.type);

    GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_eat");
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
    if (!this.chomped) this._onChomp();

    this.creature.foodEaten[this.food.type] += this.amountEaten;

    GlassLab.SignalManager.creatureEats.dispatch(this.creature);

    // Choose which state to go to based on the situation...
    if (this.creature.getIsSick()) {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
    } else if (this.creature.pen) { // continue to the next part of the pen
        this.creature.tryWalkToNextFood();
    } else { // eating outside of pen, so just continue to the next target or go to idle
        if (this.creature.getIsSatisfied())
        {
            GlassLab.SignalManager.creatureFed.dispatch(this.creature);
            this.creature.Emote(true);
            GLOBAL.creatureManager.LogNumCreaturesFed(this.creature.type, 1);
        }
        this.creature.lookForTargets();
    }
};
