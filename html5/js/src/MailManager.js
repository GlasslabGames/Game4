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

    this.ordersMenu = new GlassLab.OrdersMenu(game, -250, -210);
    GLOBAL.UIManager.centerAnchor.addChild(this.ordersMenu.sprite);

    this.rewardsPopup = new GlassLab.RewardPopup(game, -120, 20);
    GLOBAL.UIManager.centerAnchor.addChild(this.rewardsPopup);
    this.rewardsPopup.Hide();

    this.availableOrders = [];
    this.rewards = [];

    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);

    GlassLab.SignalManager.orderStarted.add(this._onOrderStarted, this);
};

GlassLab.MailManager.prototype.ShowMail = function(auto)
{
    if (this.rewards.length == 0)
    {
        if (this.availableOrders.length != 0)
        {
            this.ordersMenu.Show();
        }
        else
        {
            //console.error("No orders to show!");
            var button, modal;
            button = new GlassLab.UIRectButton(this.game, 0, 0, function() {
                modal.destroy(true);
            }, this, 150, 60, 0xffffff, "Ok");
            modal = new GlassLab.UIModal(this.game, "You don't have any mail!", button);
            GLOBAL.UIManager.centerAnchor.addChild(modal);
        }
    }
    else
    {
        var rewardOrder = this.rewards.shift();
        this.rewardsPopup.Show(rewardOrder);
        GlassLab.SignalManager.ordersChanged.dispatch();
    }
};

GlassLab.MailManager.prototype.HideMail = function(auto)
{
    this.ordersMenu.Hide();
};

GlassLab.MailManager.prototype.IsMailShowing = function()
{
    return this.ordersMenu.IsShowing();
}

/**
 * @param args Takes in any number of order blob arguments
 * @public
 */
GlassLab.MailManager.prototype.AddOrders = function(prepend)
{
    for (var i=0; i < arguments.length; i++)
    {
        this.availableOrders.push(arguments[i]);
    }

    GlassLab.SignalManager.ordersChanged.dispatch(arguments);
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

GlassLab.MailManager.prototype._onOrderStarted = function(order) {
    this.currentOrder = order;
    GlassLab.SignalManager.ordersChanged.dispatch(order);
};

GlassLab.MailManager.prototype._onOrderCanceled = function(order) {
    this.currentOrder = null;
    GlassLab.SignalManager.ordersChanged.dispatch(order);
};

GlassLab.MailManager.prototype.completeOrder = function(order, success)
{
    var orderIndex = this.availableOrders.indexOf(order);
    if (orderIndex == -1) console.warn("Order was completed that wasn't managed by MailManager.");
    else this.availableOrders.splice(orderIndex, 1);

    this.currentOrder = null;

    this.rewards.push(order); // the reward popup will send OrderResolved when it's closed
    GlassLab.SignalManager.ordersChanged.dispatch(order); // dispatch this so that the alert shows up on the mail
    GlassLab.SignalManager.rewardAdded.dispatch(order); // dispatch this so that the alert shows up on the mail
};

GlassLab.MailManager.prototype._onGameLoaded = function(blob)
{
    this.availableOrders = blob.availableOrders || [];

    this.rewards = blob.rewards || [];

    if (this.availableOrders.length > 0 || this.rewards.length > 0)
    {
        GlassLab.SignalManager.ordersChanged.dispatch(arguments);
    }
};