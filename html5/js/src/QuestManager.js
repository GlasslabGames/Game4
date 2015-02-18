/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.QuestManager = function(game)
{
    this.game = game;

    this._currentObjective = "";

    this.quests = [
        new GlassLab.Quest(this.game.cache.getJSON("vs_quest"))
    ];
};


GlassLab.QuestManager.prototype.UpdateObjective = function(objectiveText)
{
    this._currentObjective = objectiveText;

    GlassLab.SignalManager.objectiveUpdated.dispatch(this._currentObjective);
}