/**
 * Created by Jerry Fu on 2/10/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.SetObjectiveAction = function(game, text)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    this.text = text;
};

GlassLab.SetObjectiveAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.SetObjectiveAction.prototype.constructor = GlassLab.SetObjectiveAction;

GlassLab.SetObjectiveAction.prototype.Do = function()
{
    GLOBAL.objectiveLabel.setText(this.text);
    this._complete();
};