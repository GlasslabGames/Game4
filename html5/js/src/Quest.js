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

    this.serializedChallenges = {progression: data.progression, fun: data.funChallenges};
    this.challenges = {progression: [], fun: []};
    // Review challenges are listed by key, so add each review section.
    for (var key in data.reviewChallenges) {
        this.serializedChallenges["review_"+key] = data.reviewChallenges[key];
        this.challenges["review_"+key] = [];
    }

    this.backgroundOrders = data.backgroundOrders;
    this.unlockedFood = data.unlockedItems;
    this.hideBackgroundOrders = data.hideBackgroundOrders;

    GLOBAL.questManager.questsByName[this.name] = this;

    this.failureCount = 0; // this is a count of how many times they've failed the current challenge.

    GlassLab.SignalManager.gameInitialized.addOnce(this._loadQuestState, this);
};

GlassLab.Quest.prototype.Start = function()
{
    //console.log("Starting quest", this.name, this.savedState);
    if (!this._isStarted)
    {
        this._isStarted = true;

        var savedData = this.savedState || {};
        this.savedState = null; // only look at the saved state once - if we start a new quest later we don't want this info hanging around

        this.index = savedData.index || {progression: 0, review: 0, fun: 0};
        this._resetFunCountdown(); // we remember the fun countdown across multiple playthroughs
        this.inReview = savedData.inReview || false;
        this.reviewKey = savedData.reviewKey || null;
        this.savedFailureCount = savedData.failureCount || 0; // remember that the failure count was saved from a previous session

        // Allow skipping ahead via url parameters
        var index = getParameterByName("challenge"); // if just challenge, use it to set the progressionChallenge
        if ((index && !isNaN(index)) || index === 0) {
            this.index.progression = index-1; // +1 so that "1" means the first challenge
        } else {
            for (var key in this.index) {
                var index = getParameterByName(key + "Challenge"); // funChallenge, reviewChallenge, progressionChallenge
                if ((index && !isNaN(index)) || index === 0) {
                    this.index[key] = index-1; // +1 so that "1" means the first challenge
                    if (key == "fun") this.funCountdown = 0; // time for a fun challenge
                    else if (key == "review") this.inReview = true;
                    break;
                }
            }
        }
        var reviewKeyParam = getParameterByName("reviewKey");
        if (reviewKeyParam) this.reviewKey = "review_"+reviewKeyParam;


        GLOBAL.dayManager.dayMeter.SetDots(this.serializedChallenges.progression.length);
        if (this.unlockedFood) {
            for (var i=0; i < this.unlockedFood.length; i++) {
                GLOBAL.inventoryManager.unlock(this.unlockedFood[i]);
            }
        }

        GlassLab.SignalManager.questStarted.dispatch(this);

        this._startNextChallenge();
    }

    GLOBAL.UIManager.mailButton.visible = !this.hideBackgroundOrders;
};

GlassLab.Quest.prototype._hasNextChallenge = function(category) {
    return (category in this.serializedChallenges && this.index[category] < this.serializedChallenges[category].length);
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
    if (this.funCountdown <= 0 && this._hasNextChallenge("fun")) { // Time for a fun challenge!
        this.currentChallengeCategory = "fun";
    } else if (this.inReview && this.reviewKey && this._hasNextChallenge(this.reviewKey)) {
        this.currentChallengeCategory = this.reviewKey;
    } else if (this._hasNextChallenge("progression")) { // even if we were supposed to be in review, fall back to the progression if we don't have enough review problems
        this.currentChallengeCategory = "progression";
        GLOBAL.dayManager.AdvanceTo(this.index.progression);
    } else { // We don't have another challenge! The quest is over!
        //console.log("End the quest!");
        this._complete();
        return;
    }

    GLOBAL.mailManager.ClearOrders(); // erase all pending orders

    this.failureCount = this.savedFailureCount || 0; // unless we had failures saved from last time, reset the count
    this.savedFailureCount = 0; // only remember the previous failures once

    console.log("Starting",this.name,"challenge:",this.currentChallengeCategory,this.index[this.currentChallengeCategory]+1);

    this.challenge = this._getNextChallenge(this.currentChallengeCategory);
    this.challenge.onComplete.remove(this._onChallengeComplete, this); // in case we had previously added this listener, remove it to make sure we have just one copy
    this.challenge.onComplete.addOnce(this._onChallengeComplete, this);
    this.challenge.Do(false, (this.failureCount >= 3), this.failureCount); // on the 4th attempt, if they failed the first 3 times

    this._addBackgroundOrders(); // note that we should have already added the challenge order when we called this.challenge.do()

    this._saveQuestState();
};

GlassLab.Quest.prototype.restartChallenge = function() {
    console.log("Restarting",this.currentChallengeCategory,"challenge",this.index[this.currentChallengeCategory]);
    this.failureCount ++;
    this.challenge.Do(true, (this.failureCount >= 3), this.failureCount); // re-do the current challenge, with constraints if we've made more than 3 attempts

    this._saveQuestState();
};

GlassLab.Quest.prototype._onChallengeComplete = function() {
    var cat = this.currentChallengeCategory; // meow
    if (cat == "fun") {
        this._resetFunCountdown();
    } else {
        this.funCountdown --; // we just finished a non-fun challenge, so decrease the time before the next one
    }

    var perfect = this.failureCount == 0; // this will be true if they never had to redo the level

    if (cat.indexOf("review") != -1) { // adjust their position in the review list depending on their performance
        this.index[cat] += (perfect)? -2 : 1; // up 2 if they were perfect, down 1 otherwise
        if (this.index[cat] >= this.serializedChallenges[cat].length) { // if they're off the bottom of the list
            this.index[cat] = this.serializedChallenges[cat].length - 2; // go to the 2nd to last problem so they don't repeat the last one again
        }
        if (this.index[cat] < 0) {
            this.inReview = false; // they made it out of the review list
        }
    } else {
        this.index[cat] ++; // for progression and fun, just move forward one

        if (cat == "progression" && !perfect && this.reviewKey) { // bump them into the review challenges
            // Note that this.reviewKey is set externally when we start a challenge (DoChallengeAction).
            this.inReview = true;
            this.index[this.reviewKey] = 0; // start at the beginning/top of the review challengess
        }
    }

    this.challenge.Destroy(); // we're done with this challenge, so get rid of it

    this._startNextChallenge();
};

GlassLab.Quest.prototype.jumpToReview = function(reviewKey) {
    this.reviewKey = reviewKey || this.reviewKey;
    this.inReview = true;
    this.index[this.reviewKey] = 0;
    this.challenge.Destroy();
    this._startNextChallenge(); // it will start the appropriate review challenge
};

GlassLab.Quest.prototype._resetFunCountdown = function() {
    this.funCountdown = Math.floor(Math.random() * 2) + 2; // how long until the next fun challenge, 2-3
};

GlassLab.Quest.prototype._addBackgroundOrders = function() {
    if (GLOBAL.mailManager.availableOrders.length >= 3) return;

    for (var i = 0; i < this.backgroundOrders.length; i++) {
        var order = this.backgroundOrders[i].orderData;
        order.id = this.backgroundOrders[i].orderId; // this wasn't originally part of the order data, but it will be useful to have later
        if (!GLOBAL.mailManager.isOrderComplete(order.id)) { // only add orders that the player hasn't successfully completed yet
            GLOBAL.mailManager.AddOrders(order);
        }
    }
};

Object.defineProperty(GlassLab.Quest.prototype, 'isStarted', {
    get: function() {
        return this._isStarted;
    }
});

GlassLab.Quest.prototype.Reset = function()
{
    this.Cancel();
};

GlassLab.Quest.prototype.Cancel = function()
{
    if (this.challenge != null)
    {
        // Find deserialized challenge, remove it
        for (var key in this.challenges) {
            for (var index in this.challenges[key]) {
                if (this.challenges[key][index] == this.challenge) delete this.challenges[key][index];
            }
        }

        this.challenge.Destroy();
        this.challenge = null;
    }
    this._isStarted = this._isComplete = false;
};

GlassLab.Quest.prototype._complete = function()
{
    if (!this._isComplete)
    {
        this._isComplete = true;
        this._isStarted = false;

        GlassLab.SignalManager.questEnded.dispatch(this);

        // Delete all the challenges we've deserialized
        for (var key in this.challenges) {
            for (var index in this.challenges[key]) {
                if (this.challenges[key][index]) this.challenges[key][index].Destroy();
            }
        }
        this.challenges = {};
    }
};

GlassLab.Quest.prototype.setReviewKey = function(key, failureKey) {
    // This gets called from DoChallengeAction so that we know what review section to go to if we do poorly on this challenge.
    // We can't just check the serialized actions because the top level might be a random group, etc.
    // If we're starting a progression challenge, we want to set the reviewKey even if it gets set to null.
    // But otherwise, we don't want to change it (else it would be set to null whenever we started a review challenge too)
    if (this.currentChallengeCategory == "progression") {
        this.reviewKey = (key) ? "review_" + key : null;
        this.failureReviewKey = (failureKey) ? "review_" + failureKey : null;
    }
};

GlassLab.Quest.prototype._saveQuestState = function()
{
    var questData = {};
    questData.name = this.name;
    questData.inReview = this.inReview;
    questData.reviewKey = this.reviewKey;
    questData.index = this.index;
    questData.failureCount = this.failureCount;
    GLOBAL.saveManager.SaveData("questState", questData);
};

GlassLab.Quest.prototype._loadQuestState = function()
{
    if (GLOBAL.saveManager.HasData("questState")) {
        this.savedState = GLOBAL.saveManager.LoadData("questState");
        if (this.savedState.name != this.name) this.savedState = {};
    } else this.savedState = {};
    return this.savedState;
};