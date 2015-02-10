/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DebugTextAction = function(game, text)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    this.textField = game.make.text(0,0, text);
};

GlassLab.DebugTextAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DebugTextAction.prototype.constructor = GlassLab.DebugTextAction;

GlassLab.DebugTextAction.prototype.Do = function()
{
    this.game.world.add(this.textField);

    this._complete();
};