/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.QuestManager = function(game)
{
    this.game = game;

    this._currentObjective = "";

    this.quests = [
        new GlassLab.Quest([
            new GlassLab.DisplayModalAction(game, "It's a beautiful day on Mixia!"),
            new GlassLab.SetObjectiveAction(game, "Feed 4 rams in the pen!"),
            new GlassLab.ClearWorldAction(),
            new GlassLab.CreatePenAction(game, {type: "rammus", bottomDraggable: true, leftDraggable: true, topDraggable: true}),
            new GlassLab.CreateCreaturesAction(game, {
                rammus: 4
            }),
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
            new GlassLab.WaitForCondition([new GlassLab.SignalCondition(GlassLab.SignalManager.journalClosed)]),
            new GlassLab.ClearWorldAction(),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Ship an order of carrots."),
            new GlassLab.AddOrderAction(game,
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                numCreatures: 5,
                type: "rammus",
                description: "Dear Friend! I want 5 AQUA RAMS. But I also need ENOUGH FOOD to keep them all satisfied during the journey.",
                fulfilled: false,
                reward: 200
            }),
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
            //new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.WaitForCondition([new GlassLab.SignalCondition(GlassLab.SignalManager.journalClosed)]),
            new GlassLab.ClearWorldAction(),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Feed one unicorn."),
            new GlassLab.CreatePenAction(game, {type: "unifox"}),
            new GlassLab.CreateCreaturesAction(game, {
                unifox: 1
            }),
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
            new GlassLab.WaitForCondition([new GlassLab.SignalCondition(GlassLab.SignalManager.journalClosed)]),
            new GlassLab.DisplayModalAction(game, "The sun sets on lovely Mixia.")
        ])
    ];
};


GlassLab.QuestManager.prototype.UpdateObjective = function(objectiveText)
{
    this._currentObjective = objectiveText;

    GlassLab.SignalManager.objectiveUpdated.dispatch(this._currentObjective);
}

GlassLab.QuestManager.prototype.gogogogogo = function()
{
    //this.quests[0].Start();
};