/**
 * Created by Rose Abernathy on 2/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.StartChallengeAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.StartChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.StartChallengeAction.prototype.constructor = GlassLab.StartChallengeAction;

GlassLab.StartChallengeAction.prototype.Do = function()
{
    GlassLabSDK.setOptions({gameLevel: this.id});
    GlassLab.SignalManager.challengeStarted.dispatch(this.id, this.problemType, this.challengeType);

    GLOBAL.questManager.UpdateObjective(this.objective);
    this._complete();
};