/**
 * Created by Jerry Fu on 1/26/2015.
 */

var GlassLab = GlassLab || {};

/**
 * MailManager
 */

GlassLab.MailManager = function(game)
{
    this.game = game;

    this.ordersMenu = new GlassLab.OrdersMenu(game, -200, -300);
    GLOBAL.UIManager.centerAnchor.addChild(this.ordersMenu.sprite);

    this.rewardsPopup = new GlassLab.RewardPopup(game, -200, -300);
    GLOBAL.UIManager.centerAnchor.addChild(this.rewardsPopup);

    this.availableOrders = [];
    this.rewards = [];

    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
};

GlassLab.MailManager.prototype.ShowMail = function()
{
    if (this.rewards.length == 0)
    {
        this.ordersMenu.Show();
    }
    else
    {
        this.rewardsPopup.Show(this.rewards.shift());
    }
};

GlassLab.MailManager.prototype.HideMail = function()
{
    this.ordersMenu.Hide();
};

GlassLab.MailManager.prototype.IsMailShowing = function()
{
    return this.ordersMenu.IsShowing();
}

GlassLab.MailManager.prototype.AddOrder = function(order)
{
    this.availableOrders.push(order);
};

GlassLab.MailManager.prototype.ClearOrders = function()
{
    this.availableOrders = [];
};

GlassLab.MailManager.prototype._onSaveRequested = function(blob)
{
    blob.availableOrders = this.availableOrders;
    blob.rewards = this.rewards;
};

GlassLab.MailManager.prototype._onOrderCompleted = function(order)
{
    var orderIndex = this.availableOrders.indexOf(order);
    if (orderIndex == -1)
    {
        console.warn("Order was completed that wasn't managed by MailManager.");
    }
    else
    {
        this.availableOrders.splice(orderIndex, 1);
    }

    this.rewards.add(order);
};