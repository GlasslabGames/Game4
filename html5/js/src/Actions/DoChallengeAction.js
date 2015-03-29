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
    this.serializedTutorial = null;
    this.boss = false;
    this.challengeData = {};
    this.reviewKey = null;
};

GlassLab.DoChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DoChallengeAction.prototype.constructor = GlassLab.DoChallengeAction;

GlassLab.DoChallengeAction.prototype.Do = function()
{
    GLOBAL.levelManager._destroyCurrentLevel(); // wipe the world in preparation

    GlassLabSDK.setOptions({gameLevel: this.challengeId});

    GlassLab.SignalManager.challengeStarted.dispatch(this.challengeId, this.challengeType, this.problemType, this.boss);

    GLOBAL.questManager.UpdateObjective(this.objective);

    this.tutorial = null;
    if (this.serializedTutorial) {
        this.tutorial = GlassLab.Deserializer.deserializeObj(this.serializedTutorial);
        this.tutorial.Do();
    }

    // we should be in a quest, and we want to remember what review section to go to if we do poorly on this challenge
    if (GLOBAL.questManager.GetCurrentQuest()) GLOBAL.questManager.GetCurrentQuest().setReviewKey(this.reviewKey);
};

GlassLab.DoChallengeAction.prototype.completeChallenge = function()
{
    if (this.tutorial) this._cancelTutorial();
    GLOBAL.levelManager._destroyCurrentLevel();
    GLOBAL.questManager.completeChallenge();
    this._complete();
};


GlassLab.DoChallengeAction.prototype.failChallenge = function()
{
    if (this.tutorial) this._cancelTutorial();
    GLOBAL.questManager.failChallenge();
};

GlassLab.DoChallengeAction.prototype._onDestroy = function() {
    if (this.tutorial) this._cancelTutorial();
};

GlassLab.DoChallengeAction.prototype._cancelTutorial = function() {
    GLOBAL.UIManager.hideArrow();
    GLOBAL.assistant.hide();
    this.tutorial.Destroy();
};