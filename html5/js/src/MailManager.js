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

    this.ordersMenu = new GlassLab.OrdersMenu(game);
    GLOBAL.UIManager.centerAnchor.addChild(this.ordersMenu);

    this.rewardsPopup = new GlassLab.RewardPopup(game);
    GLOBAL.UIManager.centerAnchor.addChild(this.rewardsPopup);

    this.availableOrders = [];
    this.ordersCompleted = []; // list of completed background orders by ID so we don't add them again
    this.rewards = [];

    GlassLab.SignalManager.penFeedingStarted.add(this.HideMail, this); // hide when we start feeding in the pen
};

GlassLab.MailManager.prototype.ShowMail = function(auto)
{
    if (this.rewards.length == 0)
    {
        GLOBAL.UIManager.showInsteadOfOtherWindows(this.ordersMenu);
    }
    else
    {
        var rewardOrder = this.rewards.shift();
        this.rewardsPopup.show(rewardOrder);
        GlassLab.SignalManager.ordersChanged.dispatch();
    }
};

GlassLab.MailManager.prototype.HideMail = function(auto)
{
    this.ordersMenu.hide();
    this.rewardsPopup.hide();
};

GlassLab.MailManager.prototype.IsMailShowing = function()
{
    return this.ordersMenu.open || this.rewardsPopup.open;
};

/**
 * @param args Takes in any number of order blob arguments
 * @public
 */
GlassLab.MailManager.prototype.AddOrders = function()
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

GlassLab.MailManager.prototype.startOrder = function(order) {
    this.currentOrder = order;
    GLOBAL.transition.do();
    GLOBAL.transition.onMiddle.addOnce(function() {
        GlassLab.SignalManager.ordersChanged.dispatch(order);
        this.enterOrderFulfillment();
    }, this);
};

GlassLab.MailManager.prototype.stopOrder = function() {
    this.currentOrder = null;
    GLOBAL.transition.do();
    GLOBAL.transition.onMiddle.addOnce(function() {
        GlassLab.SignalManager.ordersChanged.dispatch();
        this.exitOrderFulfillment();
    }, this);
};

GlassLab.MailManager.prototype.cancelOrder = function() {
    if (!this.currentOrder) return; // no order to cancel

    this.stopOrder();
    GLOBAL.transition.onMiddle.addOnce(function() {
        GlassLabSDK.saveTelemEvent("cancel_order", {});
        GlassLab.SignalManager.orderCanceled.dispatch(this.data);
    });
};

GlassLab.MailManager.prototype.completeOrder = function(order, result)
{
    // remove the order from its position in the list
    var orderIndex = this.availableOrders.indexOf(order);
    if (orderIndex == -1) console.warn("Order was completed that wasn't managed by MailManager.");
    else this.availableOrders.splice(orderIndex, 1);

    if (order.id) { // this is a background order
        if (result == GlassLab.results.satisfied) { // when they beat a background order, record that they completed it
            this.ordersCompleted.push(order.id);
            GLOBAL.saveManager.SaveData("ordersCompleted", this.ordersCompleted);
        } else {
            this.availableOrders.push(order); // when they fail a background order, re-add it to the back of the queue
        }
    }


    this.stopOrder();

    GLOBAL.transition.onMiddle.addOnce(function() {
        GlassLab.SignalManager.orderShipped.dispatch(order, result); // it's weird to have this here, but right now the mailbutton appears when we send it, which we don't want to do earlier.
    }, this);

    GLOBAL.transition.onComplete.addOnce(function() {
        this.rewardsPopup.show(order);
    }, this);
};

GlassLab.MailManager.prototype.isOrderComplete = function(orderId) {
    if (GLOBAL.saveManager.HasData("ordersCompleted")) {
        this.ordersCompleted = GLOBAL.saveManager.LoadData("ordersCompleted");
    }
    return this.ordersCompleted.indexOf(orderId) != -1;
};

GlassLab.MailManager.prototype.enterOrderFulfillment = function() {
    GLOBAL.penManager.hidePens();
    GLOBAL.creatureManager.hideCreatures();
    for (var i = GLOBAL.foodLayer.children.length-1; i>=0; i--) {
        GLOBAL.foodLayer.getChildAt(i).visible = false;
    }
    GLOBAL.orderFulfillment.show(this.currentOrder);
    GLOBAL.tiledBg.visible = true;
    this.ordersMenu.hide(true);

    GLOBAL.dayManager.dayMeter.visible = false;

    GLOBAL.UIManager.toggleCancelHUDButton(true);
    GLOBAL.UIManager.toggleZoomHUDButtons(false);
};

GlassLab.MailManager.prototype.exitOrderFulfillment = function() {
    GLOBAL.penManager.showPens();
    GLOBAL.creatureManager.showCreatures();
    for (var i = GLOBAL.foodLayer.children.length-1; i>=0; i--) {
        GLOBAL.foodLayer.getChildAt(i).visible = true;
    }

    GLOBAL.dayManager.dayMeter.visible = true;

    GLOBAL.orderFulfillment.hide(true);
    GLOBAL.tiledBg.visible = false;
    GLOBAL.UIManager.resetCamera();
    GLOBAL.UIManager.toggleCancelHUDButton(false);
    GLOBAL.UIManager.toggleZoomHUDButtons(true);
};