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
        new GlassLab.Quest("day3", this.game.cache.getJSON("day3"))
    ];

    GlassLab.SignalManager.questStarted.add(this._onQuestStarted, this);
    GlassLab.SignalManager.questEnded.add(this._onQuestEnded, this);
    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);

    // These things actually end the level
    GlassLab.SignalManager.feedingPenResolved.add(this._onFeedingPenResolved, this);

    this.challengeIsBossLevel = false;
    GlassLab.SignalManager.challengeStarted.add(this._onChallengeStarted, this);
};

GlassLab.QuestManager.prototype._onChallengeStarted = function(id, problemType, challengeType, isBoss)
{
    this.challengeIsBossLevel = isBoss;
    this.challengeType = challengeType;
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
};

GlassLab.QuestManager.prototype.failChallenge = function() {
    if (this.challengeIsBossLevel) GLOBAL.levelManager.RestartLevel(); // restart the whole day
    else this.GetCurrentQuest().restartChallenge(); // restart the current challenge
};

GlassLab.QuestManager.prototype.UpdateObjective = function(objectiveText)
{
    this._currentObjective = objectiveText;

    GlassLab.SignalManager.objectiveUpdated.dispatch(this._currentObjective);
};

GlassLab.QuestManager.prototype._onSaveRequested = function(blob)
{
    blob.currentObjective = this._currentObjective;

    blob.activeQuests = [];

    for (var i=0; i < this.activeQuests.length; i++)
    {
        var quest = this.activeQuests[i];
        blob.activeQuests.push({
            name: quest.name,
            currentActionIndex: quest._currentActionIndex,
            complete: quest._isComplete
        });
    }
};

GlassLab.QuestManager.prototype._onGameLoaded = function(blob)
{
    this.UpdateObjective(blob.currentObjective);

    for (var i=0; i < blob.activeQuests.length; i++)
    {
        var questData = blob.activeQuests[i];
        var quest = this.questsByName[questData.name];
        quest._isComplete = questData.complete;

        quest._currentActionIndex = questData.currentActionIndex-1;
        quest._isStarted = false;
        quest.Start();
    }
};

GlassLab.QuestManager.prototype._onFeedingPenResolved = function(pen, win)
{
    if (win && this.challengeType == "pen") {
        GLOBAL.UIManager.winModal.visible = true;
        GLOBAL.audioManager.playSound("success");
        // this.completeChallenge will be called when they close the popup
    }
};

GlassLab.QuestManager.prototype.completeChallenge = function() {
    if (GLOBAL.Journal.wantToShow) {
        if (false) { // show the journal immediately
            GLOBAL.Journal.Show(true);
            GlassLab.SignalManager.journalClosed.addOnce(function() {
                GlassLab.SignalManager.challengeComplete.dispatch();
            }, this);
        } else {
            GLOBAL.UIManager.journalButton.toggleActive(true);
            GlassLab.SignalManager.challengeComplete.dispatch();
        }
    } else {
        GlassLab.SignalManager.challengeComplete.dispatch();
    }
};