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

    var objective = this.objective;

    if (this.challengeType == "handfeeding") {
        GLOBAL.creatureManager.CreateCreatures(this.challengeData.creatureType, this.challengeData.numCreatures, this.challengeData.centered);
        if (!objective) {
            objective = "Feed " + this.challengeData.numCreatures + " " + GLOBAL.creatureManager.GetCreatureName(this.challengeData.creatureType, this.challengeData.numCreatures > 1);
        }
    } else if (this.challengeType == "pen") {
        GLOBAL.creatureManager.CreateCreatures(this.challengeData.creatureType, this.challengeData.numCreatures);
        GLOBAL.penManager.CreatePen(this.challengeData, this.challengeData.startCol, this.challengeData.startRow);
        if (!objective) {
            objective = "Feed " + this.challengeData.numCreatures + " " + GLOBAL.creatureManager.GetCreatureName(this.challengeData.creatureType, this.challengeData.numCreatures > 1) + " in the pen";
        }
    } else if (this.challengeType == "order") {
        this.challengeData.key = true; // this is a key order for this challenge
        GLOBAL.mailManager.AddOrders(this.challengeData);
        if (!objective) objective = "Fulfill an urgent order";
    }

    GLOBAL.questManager.UpdateObjective(objective);

    if (this.completeListenerBinding) this.completeListenerBinding.detach(); // make sure we don't have multiple copies
    this.completeListenerBinding = GlassLab.SignalManager.challengeComplete.addOnce(this._onChallengeComplete, this);
};

GlassLab.DoChallengeAction.prototype._onDestroy = function()
{
    if (this.completeListenerBinding) {
        GlassLab.SignalManager.challengeComplete.remove(this._onChallengeComplete, this);
    }
};

GlassLab.DoChallengeAction.prototype._onChallengeComplete = function()
{
    GLOBAL.levelManager._destroyCurrentLevel();
    this._complete();
};