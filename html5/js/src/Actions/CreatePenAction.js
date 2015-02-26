/**
 * Created by Jerry Fu on 2/13/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreatePenAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
    this.penData = data;
};

GlassLab.CreatePenAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreatePenAction.prototype.constructor = GlassLab.CreatePenAction;

GlassLab.CreatePenAction.prototype.Do = function()
{
    var pen = GLOBAL.penManager.CreatePen(this.penData, this.penStartCol, this.penStartRow);
    this._complete();
};