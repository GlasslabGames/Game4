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
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
            new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Ship an order of carrots."),
            new GlassLab.AddOrderAction(game,
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                numCreatures: 5,
                type: "rammus2",
                description: "Dear Friend! I want 7 AQUA RAMS. But I also need ENOUGH FOOD to keep them all satisfied during the journey.",
                fulfilled: false,
                reward: 200
            }),
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
            new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
            new GlassLab.AdvanceDayAction(game),
            new GlassLab.SetObjectiveAction(game, "Feed one unicorn."),
            new GlassLab.WaitForCondition([new GlassLab.FeedAnimalCondition(game, "rammus", 3)]),
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