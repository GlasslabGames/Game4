/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.QuestManager = function(game)
{
    this.game = game;
    this.quests = [
        new GlassLab.Quest([
            new GlassLab.DisplayModalAction(game, "It's a beautiful day on Mixia!"),
            new GlassLab.SetObjectiveAction(game, "Feed 4 rams in the pen!"),
            new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Ship an order of carrots."),
            new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Feed one unicorn."),
            new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.DisplayModalAction(game, "The sun sets on lovely Mixia.")
        ])
    ];
};


GlassLab.QuestManager.prototype.gogogogogo = function()
{
    this.quests[0].Start();
};