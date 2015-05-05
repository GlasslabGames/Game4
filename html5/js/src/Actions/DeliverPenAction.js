/**
 * Created by Rose Abernathy on 5/5/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DeliverPenAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
};

GlassLab.DeliverPenAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DeliverPenAction.prototype.constructor = GlassLab.DeliverPenAction;

GlassLab.DeliverPenAction.prototype.Do = function()
{
    var pen = GLOBAL.penManager.CreatePen(this.data);
    GLOBAL.penManager.zoomToPen(pen);
    //this._complete();
};