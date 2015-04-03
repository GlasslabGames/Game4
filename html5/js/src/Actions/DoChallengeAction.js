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
    this.constraints = null;
    this.reviewKey = null;
    this.constraintsActive = false;
};

GlassLab.DoChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DoChallengeAction.prototype.constructor = GlassLab.DoChallengeAction;

GlassLab.DoChallengeAction.prototype.Do = function(redo, withConstraints)
{
    GLOBAL.levelManager._destroyCurrentLevel(); // wipe the world in preparation
    GLOBAL.UIManager.resetCamera(); // scroll back to the middle of the world

    GlassLabSDK.endSessionAndFlush(function(data){
        console.log("Session ended: "+data);
    }.bind(this), function(data) {
        console.log("Session end failed: "+data);
    }.bind(this));
    GlassLabSDK.setOptions({gameLevel: this.challengeId});
    GlassLabSDK.startSession(function(data){
        console.log("Session started: "+data);
    }.bind(this), function(data) {
        console.log("Session start failed: "+data);
    }.bind(this));

    this.tutorial = null;
    if (this.serializedTutorial) {
        this.tutorial = GlassLab.Deserializer.deserializeObj(this.serializedTutorial);
        GLOBAL.game.time.events.add(10, this.tutorial.Do, this.tutorial); // wait a moment so this happens after we cancel the prev tutorial
    }

    // we should be in a quest, and we want to remember what review section to go to if we do poorly on this challenge
    if (GLOBAL.questManager.GetCurrentQuest()) {
        GLOBAL.questManager.GetCurrentQuest().setReviewKey(this.reviewKey, this.reviewKeyForFailure);
    }

    // To avoid modifying the original challengeData, we make a copy for child classes (DoPenAction, etc) to use and then apply constraints
    this.data = {};
    for (var key in this.challengeData) {
        this.data[key] = this.challengeData[key];
    }
    if (withConstraints && this.constraints) {
        for (var key in this.constraints) {
            this.data[key] = this.constraints[key];
        }
    }

    GLOBAL.questManager.UpdateObjective(this.objective || this.getDefaultObjective());

    GlassLab.SignalManager.challengeStarted.dispatch(this.challengeId, this.challengeType, this.problemType, this.boss);
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

GlassLab.DoChallengeAction.prototype.getDefaultObjective = function() {
    return "Complete the challenge";
};