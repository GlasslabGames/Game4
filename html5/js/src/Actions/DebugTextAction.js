/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DebugTextAction = function(game, text)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    GLOBAL.textField = game.make.text(0,0, "");
    GLOBAL.textField.fixedToCamera = true;
    this.game.world.add(GLOBAL.textField);
    this.text = text;
};

GlassLab.DebugTextAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DebugTextAction.prototype.constructor = GlassLab.DebugTextAction;

GlassLab.DebugTextAction.prototype.Do = function()
{
    GLOBAL.textField.setText(this.text);
    this._complete();
};