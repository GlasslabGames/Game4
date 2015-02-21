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
        new GlassLab.Quest("Vertical Slice", this.game.cache.getJSON("vs_quest")),
        new GlassLab.Quest("Alpha", this.game.cache.getJSON("alpha_quest"))
    ];

    GlassLab.SignalManager.questStarted.add(this._onQuestStarted, this);
    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);
};

GlassLab.QuestManager.prototype._onQuestStarted = function(quest)
{
    if (this.activeQuests.indexOf(quest) != -1)
    {
        console.error("Tried adding quest when it was already added!");
        return;
    }

    this.activeQuests.push(quest);
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
        quest._complete = questData.complete;

        quest._currentActionIndex = questData.currentActionIndex-1;
        quest._isStarted = false;
        quest.Start();
    }
};