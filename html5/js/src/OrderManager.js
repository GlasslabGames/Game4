/**
 * Created by Jerry Fu on 1/26/2015.
 */

var GlassLab = GlassLab || {};

/**
 * OrderManager
 */

GlassLab.OrderManager = function(game)
{
    this.game = game;
};

GlassLab.OrderManager.prototype.AddOrder = function(order)
{
    return order;
};

GlassLab.OrderManager.prototype.ActivateOrder = function(orderID)
{
    return {};
};

GlassLab.OrderManager.prototype.GetAvailableOrders = function()
{
    return [];
};
