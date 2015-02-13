/**
 * Created by Jerry Fu on 2/12/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.AddOrderAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    this.orderData = data;
};

GlassLab.AddOrderAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.AddOrderAction.prototype.constructor = GlassLab.AddOrderAction;

GlassLab.AddOrderAction.prototype.Do = function()
{
    var level = GLOBAL.levelManager.GetCurrentLevel();
    if (!level.data.orders) level.data.orders = [];
    level.data.orders.push(this.orderData);
    GlassLab.SignalManager.orderAdded.dispatch(this.orderData);
    this._complete();
};