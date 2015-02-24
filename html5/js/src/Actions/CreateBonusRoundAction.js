/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreateBonusRoundAction = function(data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.completeListenerBinding = null;
    this.data = data;
};

GlassLab.CreateBonusRoundAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreateBonusRoundAction.prototype.constructor = GlassLab.CreateBonusRoundAction;

GlassLab.CreateBonusRoundAction.prototype.Do = function()
{
    GLOBAL.sortingGame.start(this.data);

    this.completeListenerBinding = GlassLab.SignalManager.bonusGameComplete.addOnce(this._complete, this);
};

GlassLab.CreateBonusRoundAction.prototype._onDestroy = function()
{
    if (this.completeListenerBinding)
    {
        GlassLab.SignalManager.bonusGameComplete.remove(this._complete, this);
    }
};