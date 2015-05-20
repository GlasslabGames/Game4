/**
 * Created by Rose Abernathy on 2/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CompleteChallengeAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);
    this.fail = false;
};

GlassLab.CompleteChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CompleteChallengeAction.prototype.constructor = GlassLab.CompleteChallengeAction;

GlassLab.CompleteChallengeAction.prototype.Do = function()
{
    if (this.fail) {
        GLOBAL.questManager.failChallenge();
    } else {
        GLOBAL.questManager.completeChallenge();
    }
    this._complete();
};