/**
 * Created by Jerry Fu on 4/1/2015.
 */
/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateCry - chewing on some food
 */
GlassLab.CreatureStateCry = function(game, owner, duration)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.duration = duration;
    this.isCrying = false;
    this.startingCry = false;
};

GlassLab.CreatureStateCry.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateCry.constructor = GlassLab.CreatureStateCry;

GlassLab.CreatureStateCry.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);

    this.Cry();
};

GlassLab.CreatureStateCry.prototype.Exit = function()
{
    this.StopCrying();

    GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateCry.prototype.Update = function(dt) {
    if (this.isCrying)
    {
        this.duration -= dt;
        if (this.duration <= 0)
        {
            this.StopCrying();
        }
    }
};

GlassLab.CreatureStateCry.prototype.Cry = function() {
    if (!this.isCrying && !this.startingCry)
    {
        this.startingCry = true;

        var animation = this.creature.PlayAnim("cry_start");
        if (animation)
        {
            animation.onComplete.addOnce(function()
            {
                this.creature.PlayAnim("cry_loop", true);
                this.isCrying = true;
            }, this);
        }
        else
        {
            console.error("Creature tried to cry but couldn't find animation...");
        }
    }
};

GlassLab.CreatureStateCry.prototype.StopCrying = function() {
    if (this.isCrying)
    {
        var animation = this.creature.PlayAnim("cry_end");
        if (animation)
        {
            animation.onComplete.addOnce(function()
            {
                this.creature.lookForTargets();
            }, this);
        }
        else
        {
            console.error("Creature tried to stop crying but couldn't find animation...");
        }

        this.isCrying = false;
    }
};