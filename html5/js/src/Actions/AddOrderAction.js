/**
 * Created by Jerry Fu on 2/12/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.AddOrderAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
    this.data = data;
};

GlassLab.AddOrderAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.AddOrderAction.prototype.constructor = GlassLab.AddOrderAction;

GlassLab.AddOrderAction.prototype.Do = function()
{
    GLOBAL.mailManager.AddOrders(this.data);
    this._complete();
};