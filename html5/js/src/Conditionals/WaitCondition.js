/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.WaitCondition = function(game, waitTime)
{
    this.game = game;

    this.waitTime = waitTime;
    this.timer = this.game.time.create();
    this.timer.add(this.waitTime, this._onTimerComplete, this);
    this.timer.start();
};

GlassLab.WaitCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.WaitCondition.prototype.constructor = GlassLab.WaitCondition;

GlassLab.WaitCondition.prototype._calculateIsSatisfied = function()
{
    return this.timer == null;
};

GlassLab.WaitCondition.prototype._onTimerComplete = function()
{
    this.timer.stop(true);
    this.timer.destroy();
    this.timer = null;
    this.Refresh();
};