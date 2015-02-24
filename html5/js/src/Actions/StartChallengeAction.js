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
    GlassLabSDK.saveTelemEvent("start_challenge", {problem_type: this.problem_type, challenge_type: this.challenge_type});

    GLOBAL.questManager.UpdateObjective(this.objective);
    this._complete();
};