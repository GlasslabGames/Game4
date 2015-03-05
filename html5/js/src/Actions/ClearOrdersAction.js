/**
 * Created by Jerry Fu on 2/27/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.ClearOrdersAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.ClearOrdersAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ClearOrdersAction.prototype.constructor = GlassLab.ClearOrdersAction;

GlassLab.ClearOrdersAction.prototype.Do = function()
{
    GlassLab.SignalManager.update.addOnce(this._onUpdate, this);
};

GlassLab.ClearOrdersAction.prototype._onUpdate = function()
{
    GLOBAL.mailManager.ClearOrders();

    this._complete();
};