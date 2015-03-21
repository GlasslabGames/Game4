/**
 * Quest - This class just serves as a holder for a sequence of Conditionals and Actions
 *
 * Managed by QuestManager
 * Created by Jerry Fu on 2/10/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Quest = function(name, data)
{
    /**
     * @readonly
     * @type {boolean}
     * @private
     */
    this._isStarted = false;

    this.name = name;
    this._isComplete = false;
    this.serializedChallenges = {progression: data.progression, review: data.reviewChallenges, fun: data.funChallenges};
    this.challenges = {progression: [], review: [], fun: []};
    this.backgroundOrders = data.backgroundOrders;

    this.numDots = data.numDots;
    this.unlockedFood = data.unlockedItems;

    GLOBAL.questManager.questsByName[this.name] = this;
};

GlassLab.Quest.prototype.Start = function()
{
    console.log("Starting quest", this.name);
    if (!this._isStarted)
    {
        this._isStarted = true;

        this.index = {progression: 0, review: 0, fun: 0};
        this._resetFunCountdown();
        this.inReview = false;

        GLOBAL.dayManager.dayMeter.SetDots(this.numDots);
        for (var i=0; i < this.unlockedFood.length; i++) {
            GLOBAL.inventoryManager.unlock(this.unlockedFood[i]);
        }

        GlassLab.SignalManager.questStarted.dispatch(this);

        this._startNextChallenge();
    }
};

GlassLab.Quest.prototype._hasNextChallenge = function(category) {
    return (this.index[category] < this.serializedChallenges[category].length);
};

GlassLab.Quest.prototype._getNextChallenge = function(category) {
    if (!this._hasNextChallenge(category)) return null; // we don't have that many

    var index = this.index[category];
    if (!this.challenges[category][index]) { // we haven't deserialized this challenge yet
        this.challenges[category][index] = GlassLab.Deserializer.deserializeObj(this.serializedChallenges[category][index]);
    }
    return this.challenges[category][index];
};

GlassLab.Quest.prototype._startNextChallenge = function() {
    console.log("Start next challenge", this._hasNextChallenge("progression"));

    if (this.funCountdown <= 0 && this._hasNextChallenge("fun")) { // Time for a fun challenge!
        this.currentChallengeCategory = "fun";
    } else if (this.inReview && this._hasNextChallenge("review")) {
        this.currentChallengeCategory = "review";
    } else if (this._hasNextChallenge("progression")) { // even if we were supposed to be in review, fall back to the progression if we're missing review problems
        this.currentChallengeCategory = "progression";
    } else { // We don't have another challenge! The quest is over!
        this._complete();
        return;
    }

    console.log("Starting",this.currentChallengeCategory,"challenge",this.index[this.currentChallengeCategory]);
    var challenge = this._getNextChallenge(this.currentChallengeCategory);
    challenge.onComplete.addOnce(this._onChallengeComplete, this);
    challenge.Do();
};

GlassLab.Quest.prototype._onChallengeComplete = function() {
    if (this.currentChallengeCategory == "fun") {
        this._resetFunCountdown();
    } else {
        this.funCountdown --; // we just finished a non-fun challenge, so decrease the time before the next one
    }

    var perfect = true; // TODO: get whether the challenge was done perfectly

    if (this.currentChallengeCategory == "review") { // adjust their position in the review list depending on their performance
        this.index[this.currentChallengeCategory] += (perfect? -2 : 1); // up 2 if they were perfect, down 1 otherwise
        if (this.index[this.currentChallengeCategory] < 0) {
            this.inReview = false; // they made it out of the review list
        }
    } else {
        this.index[this.currentChallengeCategory] ++; // for progression and fun, just move forward one

        if (this.currentChallengeCategory == "progression" && !perfect) { // bump them into the review challenges
            this.inReview = true;
            this.index.review = 0; // start at the beginning/top of the review challengess
        }
    }

    this._startNextChallenge();
};

GlassLab.Quest.prototype._resetFunCountdown = function() {
    this.funCountdown = Math.floor(Math.random() * 2) + 2; // how long until the next fun challenge, 2-3
};

Object.defineProperty(GlassLab.Quest.prototype, 'isStarted', {
    get: function() {
        return this._isStarted;
    }
});

GlassLab.Quest.prototype.Reset = function()
{
    this._isStarted = false;
    for (var i=0, j=this.actions.length; i < j; i++)
    {
        var action = this.actions[i];
        action.completed = false;
    }
    this._currentActionIndex = -1;
};

GlassLab.Quest.prototype._procNextStep = function()
{
    if (this.actions.length == 0)
    {
        console.error("No actions in Quest");
        return;
    }

    this._currentActionIndex++;

    if (this._currentActionIndex == this.actions.length)
    {
        this._complete();
        return;
    }

    this.currentAction = this.actions[this._currentActionIndex];
    this.currentAction.onComplete.addOnce(this._procNextStep, this);
    this.currentAction.Do();
};

GlassLab.Quest.prototype.ForceComplete = function()
{
    if (this.currentAction != null)
    {
        // Cancel action?
        //console.error("Forcing a quest to complete hasn't been fully implemented yet. You may see bugs...");
    }

    this._complete();
};

GlassLab.Quest.prototype._complete = function()
{
    if (!this._isComplete)
    {
        this._isComplete = true;
        this._isStarted = false;

        GlassLab.SignalManager.questEnded.dispatch(this);
    }
};

