/**
 * Created by Rose Abernathy on 3/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoPenChallengeAction = function(game) {
    GlassLab.DoChallengeAction.prototype.constructor.call(this);

    this.challengeType = "pen";
};

GlassLab.DoPenChallengeAction.prototype = Object.create(GlassLab.DoChallengeAction.prototype);
GlassLab.DoPenChallengeAction.prototype.constructor = GlassLab.DoOrderChallengeAction;

GlassLab.DoPenChallengeAction.prototype.Do = function() {

    GlassLab.DoChallengeAction.prototype.Do.apply(this, arguments);

    GLOBAL.creatureManager.CreateCreatures(this.data.creatureType, this.data.numCreatures);

    this.pen = GLOBAL.penManager.CreatePen(this.data, this.data.startCol, this.data.startRow);
    this.pen.onResolved.add(this._onPenResolved, this);

    GLOBAL.UIManager.resetCameraPos(); // scroll to focus on the pen
};

GlassLab.DoPenChallengeAction.prototype._onDestroy = function() {
    GlassLab.DoChallengeAction.prototype._onDestroy.call(this);
    if (this.pen) this.pen.onResolved.remove(this._onPenResolved, this);
    if (this.modal) this.modal.destroy();
};

GlassLab.DoPenChallengeAction.prototype._onPenResolved = function(result, creatureType, creatureCount) {
    this.result = result;
    if (result == GlassLab.results.satisfied) {
        if (creatureType != this.data.creatureType) this.result = GlassLab.results.wrongCreatureType;
        else if (creatureCount < this.data.numCreatures) this.result = GlassLab.results.wrongCreatureNumber;
    }

    GLOBAL.game.time.events.add(2000, this._showResult, this);
};

GlassLab.DoPenChallengeAction.prototype._showResult = function() {
    if (this.result == GlassLab.results.satisfied) {
        GLOBAL.assistant.showModal("Good job! You did it!", this.completeChallenge.bind(this));
    } else {
        //var retryButton = new GlassLab.UIRectButton(GLOBAL.game, 0, 0, this.failChallenge, this, 150, 60, 0xffffff, "Retry");
        var text = "Oops, ";
        if (this.result == GlassLab.results.wrongCreatureType) text += "that wasn't the right kind of creature.";
        else if (this.result == GlassLab.results.dislike) text += "that wasn't the right kind of food.";
        else if (this.result == GlassLab.results.hungry) text += "your creatures are still hungry.";
        else if (this.result == GlassLab.results.sick) text += "your creatures ate too much!";
        else if (this.result == GlassLab.results.wrongCreatureNumber) text += "some creatures were left out of the pen.";
        else text += "that wasn't right."; // fallback

        GLOBAL.assistant.showModal(text + " Try again?", this.failChallenge.bind(this));
    }
};

GlassLab.DoPenChallengeAction.prototype.completeChallenge = function() {
    if (this.modal) this.modal.destroy();
    GlassLab.DoChallengeAction.prototype.completeChallenge.call(this);
};

GlassLab.DoPenChallengeAction.prototype.failChallenge = function() {
    if (this.modal) this.modal.destroy();
    GlassLab.DoChallengeAction.prototype.failChallenge.call(this);
};

GlassLab.DoPenChallengeAction.prototype.getDefaultObjective = function() {
    var name = GLOBAL.creatureManager.GetCreatureName(this.challengeData.creatureType, this.challengeData.numCreatures > 1) || "creatures";
    return "Feed " + this.challengeData.numCreatures + " " + name + " in the pen";
};