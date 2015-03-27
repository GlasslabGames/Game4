/**
 * Created by Rose Abernathy on 3/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoFeedingChallengeAction = function(game)
{
    GlassLab.DoChallengeAction.prototype.constructor.call(this);

    this.challengeType = "handfeeding";
};

GlassLab.DoFeedingChallengeAction.prototype = Object.create(GlassLab.DoChallengeAction.prototype);
GlassLab.DoFeedingChallengeAction.prototype.constructor = GlassLab.DoFeedingChallengeAction;

GlassLab.DoFeedingChallengeAction.prototype.Do = function()
{
    if (!this.objective) {
        var name = GLOBAL.creatureManager.GetCreatureName(this.challengeData.creatureType, this.challengeData.numCreatures > 1) || "creatures";
        this.objective = "Feed " + this.challengeData.numCreatures + " " + name;
    }

    GlassLab.DoChallengeAction.prototype.Do.call(this);

    GLOBAL.creatureManager.CreateCreatures(this.challengeData.creatureType, this.challengeData.numCreatures, this.challengeData.centered);

    this.numFed = 0;
    GlassLab.SignalManager.creatureFed.remove(this._onCreatureFed, this); // avoid duplicate events
    GlassLab.SignalManager.creatureFed.add(this._onCreatureFed, this);
};

GlassLab.DoFeedingChallengeAction.prototype._onCreatureFed = function(creature)
{
    console.log("OnCreatureFed",creature.name);
    if (creature.type == this.challengeData.creatureType) this.numFed++;

    if (this.numFed >= this.challengeData.numCreatures) {
        GLOBAL.game.time.events.add(1000, this.completeChallenge, this);
    }
};

GlassLab.DoFeedingChallengeAction.prototype._onDestroy = function() {
    GlassLab.DoChallengeAction.prototype._onDestroy.call(this);
    GlassLab.SignalManager.creatureFed.remove(this._onCreatureFed, this);
};