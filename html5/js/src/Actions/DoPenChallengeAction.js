/**
 * Created by Rose Abernathy on 3/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoPenChallengeAction = function(game) {
    GlassLab.DoChallengeAction.prototype.constructor.call(this);

    this.problemType = "pen";
};

GlassLab.DoPenChallengeAction.prototype = Object.create(GlassLab.DoChallengeAction.prototype);
GlassLab.DoPenChallengeAction.prototype.constructor = GlassLab.DoOrderChallengeAction;

GlassLab.DoPenChallengeAction.prototype.Do = function() {
    if (!this.objective) {
        var name = GLOBAL.creatureManager.GetCreatureName(this.challengeData.creatureType, this.challengeData.numCreatures > 1) || "creatures";
        this.objective = "Feed " + this.challengeData.numCreatures + " " + name + " in the pen";
    }

    GlassLab.DoChallengeAction.prototype.Do.call(this);

    GLOBAL.creatureManager.CreateCreatures(this.challengeData.creatureType, this.challengeData.numCreatures);

    this.pen = GLOBAL.penManager.CreatePen(this.challengeData, this.challengeData.startCol, this.challengeData.startRow);
    this.pen.onResolved.add(this._onPenResolved, this);
};

GlassLab.DoPenChallengeAction.prototype._onDestroy = function() {
    GlassLab.DoChallengeAction.prototype._onDestroy.call(this);
    if (this.pen) this.pen.onResolved.remove(this._onPenResolved, this);
    if (this.modal) this.modal.destroy();
};

GlassLab.DoPenChallengeAction.prototype._onPenResolved = function(result, creatureCount) {
    this.result = result;
    this.success = result == "satisfied" && creatureCount >= this.challengeData.numCreatures;
    GLOBAL.game.time.events.add(1000, this._showResult, this);
};

GlassLab.DoPenChallengeAction.prototype._showResult = function() {
    if (this.success) {
        var nextButton = new GlassLab.UIRectButton(GLOBAL.game, 0, 0, this.completeChallenge, this, 150, 60, 0xffffff, "Continue");
        this.modal = new GlassLab.UIModal(GLOBAL.game, "Good job! You did it!", nextButton);
    } else {
        var retryButton = new GlassLab.UIRectButton(GLOBAL.game, 0, 0, this.failChallenge, this, 150, 60, 0xffffff, "Retry");
        var text = "Oops, ";
        if (this.result == "hungry") text += "your creatures are still hungry.";
        else if (this.result == "sick") text += "your creatures ate too much!";
        else if (this.result == "satisfied") text += "some creatures were left out of the pen!";
        this.modal = new GlassLab.UIModal(GLOBAL.game, "", retryButton);
        this.modal.setText(text + " Try again?", true); // wrap text
    }
    GLOBAL.UIManager.centerAnchor.addChild(this.modal);
};

GlassLab.DoPenChallengeAction.prototype.completeChallenge = function() {
    if (this.modal) this.modal.destroy();
    GlassLab.DoChallengeAction.prototype.completeChallenge.call(this);
};

GlassLab.DoPenChallengeAction.prototype.failChallenge = function() {
    if (this.modal) this.modal.destroy();
    GlassLab.DoChallengeAction.prototype.failChallenge.call(this);
};