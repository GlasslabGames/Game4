/**
 * Created by Rose Abernathy on 3/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoChallengeAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.challengeId = -1;
    this.problemType = "";
    this.challengeType = "";
    this.objective = "";
    this.boss = false;
    this.challengeData = {};
};

GlassLab.DoChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DoChallengeAction.prototype.constructor = GlassLab.DoChallengeAction;

GlassLab.DoChallengeAction.prototype.Do = function()
{
    GLOBAL.levelManager._destroyCurrentLevel(); // wipe the world in preparation

    GlassLabSDK.setOptions({gameLevel: this.challengeId});

    GLOBAL.saveManager.Save("default_checkpoint"); // from SaveCheckpointAction

    GlassLab.SignalManager.challengeStarted.dispatch(this.id, this.problemType, this.challengeType, this.boss);

    GLOBAL.questManager.UpdateObjective(this.objective);
};

GlassLab.DoChallengeAction.prototype.completeChallenge = function()
{
    console.log("complete challenge",this);
    GLOBAL.levelManager._destroyCurrentLevel();
    this._complete();
};


GlassLab.DoChallengeAction.prototype.failChallenge = function()
{
    GLOBAL.questManager.failChallenge();
};