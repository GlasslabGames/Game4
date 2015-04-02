/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.QuestManager = function(game)
{
    this.game = game;
    GLOBAL.questManager = this;

    this._currentObjective = "";

    this.questsByName = {};

    this.activeQuests = [];

    this.quests = [
        new GlassLab.Quest("day1", this.game.cache.getJSON("day1")),
        new GlassLab.Quest("day2", this.game.cache.getJSON("day2")),
        new GlassLab.Quest("day3", this.game.cache.getJSON("day3")),
        new GlassLab.Quest("day4", this.game.cache.getJSON("day4")),
        new GlassLab.Quest("day5", this.game.cache.getJSON("day5")),
        new GlassLab.Quest("day6", this.game.cache.getJSON("day6")),
        new GlassLab.Quest("day7", this.game.cache.getJSON("day7"))
    ];

    GlassLab.SignalManager.questStarted.add(this._onQuestStarted, this);
    GlassLab.SignalManager.questEnded.add(this._onQuestEnded, this);

    this.challengeIsBossLevel = false;
    GlassLab.SignalManager.challengeStarted.add(this._onChallengeStarted, this);
};

GlassLab.QuestManager.prototype._onChallengeStarted = function(id, challengeType, problemType, isBoss)
{
    this.challengeIsBossLevel = isBoss;
    this.challengeType = challengeType;

    GLOBAL.saveManager.Save(); // save when we start a new challenge
};

GlassLab.QuestManager.prototype.GetCurrentQuest = function()
{
    return this.activeQuests.length > 0 ? this.activeQuests[0] : null;
};

GlassLab.QuestManager.prototype._onQuestStarted = function(quest)
{
    if (this.activeQuests.indexOf(quest) != -1)
    {
        console.warn("Tried adding quest when it was already added! (Right now this happens on load, needs fixing)");
        return;
    }

    this.activeQuests.push(quest);

    if (this.activeQuests.length > 1)
    {
        console.warn("Current quest system works under the assumption of a single active quest. Expect bugs!");
    }
};

GlassLab.QuestManager.prototype._onQuestEnded = function(quest)
{
    var questIndex = this.activeQuests.indexOf(quest);
    if (questIndex == -1)
    {
        console.error("A quest ended but it wasn't tracked by QuestManager");
        return;
    }

    this.activeQuests.splice(questIndex, 1);
    if (!this.activeQuests.length) { // no more quests, so go to the next level
        GLOBAL.levelManager.LoadNextLevel();
    }
};

GlassLab.QuestManager.prototype.failChallenge = function() {
    GlassLab.SignalManager.challengeComplete.dispatch(false);

    /* This is how we used to do the boss level, but no longer
    if (this.challengeIsBossLevel) {
        this.GetCurrentQuest().Cancel(); // cancel the current challenge
        GLOBAL.levelManager.RestartLevel(); // restart the whole day
    */
    var quest = this.GetCurrentQuest();
    if (quest.failureReviewKey) quest.jumpToReview(quest.failureReviewKey);
    else quest.restartChallenge(); // restart the current challenge
};

GlassLab.QuestManager.prototype.completeChallenge = function() {
    GlassLab.SignalManager.challengeComplete.dispatch(true);
};

GlassLab.QuestManager.prototype.UpdateObjective = function(objectiveText)
{
    this._currentObjective = objectiveText;

    GlassLab.SignalManager.objectiveUpdated.dispatch(this._currentObjective);
};

// We need away to assign each bonus round an id that we can use for the gameLevel in the SDK
GlassLab.QuestManager.prototype.getBonusRoundId = function() {
    var level = GLOBAL.levelManager.currentLevel + 1;
    var name = "bonusRound"+level;

    var quest = this.GetCurrentQuest();
    if (quest && quest.index) {
        var index = quest.index.progression + 1;
        name += "." + index;
    }
    return name;
};