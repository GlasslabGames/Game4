/**
 * Created by Rose Abernathy on 2/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.StartChallengeAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.id = -1;
    this.challengeType = "";
    this.problemType = "";
    this.bossLevel = false;
};

GlassLab.StartChallengeAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.StartChallengeAction.prototype.constructor = GlassLab.StartChallengeAction;

GlassLab.StartChallengeAction.prototype.Do = function()
{
    GlassLabSDK.endSessionAndFlush(function(data){
        console.log("Session ended: "+data);
    }.bind(this), function(data) {
        console.log("Session end failed: "+data);
    }.bind(this));
    GlassLabSDK.setOptions({gameLevel: this.id});
    GlassLabSDK.startSession(function(data){
        console.log("Session started: "+data);
    }.bind(this), function(data) {
        console.log("Session start failed: "+data);
    }.bind(this));

    GlassLab.SignalManager.challengeStarted.dispatch(this.id, this.challengeType, this.problemType, this.bossLevel);

    GLOBAL.questManager.UpdateObjective(this.objective);

    // we should be in a quest, and we want to remember what review section to go to if we do poorly on this challenge
    if (GLOBAL.questManager.GetCurrentQuest()) GLOBAL.questManager.GetCurrentQuest().setReviewKey(this.reviewKey, this.reviewKeyForFailure);

    this._complete();
};