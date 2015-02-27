/**
 * Created by Jerry Fu on 2/27/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.EndQuestAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.EndQuestAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.EndQuestAction.prototype.constructor = GlassLab.EndQuestAction;

GlassLab.EndQuestAction.prototype.Do = function()
{
    GLOBAL.questManager.GetCurrentQuest().ForceComplete();

    this._complete();
};