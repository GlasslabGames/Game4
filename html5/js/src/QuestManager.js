/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.QuestManager = function(game)
{
    this.actions = [
        new GlassLab.WaitForCondition([new GlassLab.WaitCondition(game, 2000)]),
        new GlassLab.DebugTextAction(game, "TESTTESTTEST")
    ];
};


GlassLab.QuestManager.prototype.gogogogogo = function()
{
    if (this.actions.length == 0) return;
    var action = this.actions.pop();
    action.onComplete.add(this.gogogogogo);
    action.Do();
};