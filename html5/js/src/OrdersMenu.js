/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.OrdersMenu = function(game, x, y) {
    this.game = game;
    this.sprite = game.make.sprite(x, y);

    this.bg = game.make.sprite(0, 0, "letterBg");
    this.bg.anchor.setTo(0.5, 0.5);
    this.sprite.addChild(this.bg);

    this.portrait = game.make.sprite(-95, -150, "bossmanPhoto");
    this.portrait.anchor.setTo(.5, .5);
    this.sprite.addChild(this.portrait);

    var fontStyle = {font: '11pt AmericanTypewriter', fill: "#807c7b"};
    var infoX = 5;
    this.titleLabel = game.make.text(infoX, -220, "Shipment request", fontStyle);
    this.titleLabel.anchor.setTo(0, 0);
    this.sprite.addChild(this.titleLabel);

    this.urgentStamp = game.make.sprite(infoX, -225, "urgentStamp");
    this.sprite.addChild(this.urgentStamp);

    this.clientLabel = game.make.text(infoX, this.titleLabel.y + 35, "Client:", fontStyle);
    this.sprite.addChild(this.clientLabel);
    this.clientNameLabel = game.make.text(infoX, this.clientLabel.y + 20, "Archibold Huxley III", fontStyle);
    this.sprite.addChild(this.clientNameLabel);

    this.rewardLabel = game.make.text(infoX, this.clientNameLabel.y + 35, "Payment:", fontStyle);
    this.sprite.addChild(this.rewardLabel);
    var coin = game.make.sprite(infoX, this.rewardLabel.y + 20, "inventoryCoinIcon");
    this.sprite.addChild(coin);
    this.rewardAmountLabel = game.make.text(infoX + coin.width + 5, coin.y, "$500", fontStyle);
    this.sprite.addChild(this.rewardAmountLabel);

    this.descriptionLabel = game.make.text(-165, -45, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent maximus, risus quis dignissim lacinia, tellus eros facilisis nulla, vulputate laoreet erat nisl sit amet sem. Nam eget est a erat rhoncus consequat.",
        {wordWrap: true, wordWrapWidth: 330, font: '11pt AmericanTypewriter', fill: "#807c7b"});
    this.sprite.addChild(this.descriptionLabel);

    this.selectButton = new GlassLab.HUDButton(this.game, 0, 168, null, "letterButtonBg", "Fill Order!", {font: "16pt EnzoBlack"}, true, this._onSelectPressed, this);
    this.sprite.addChild(this.selectButton);
    this.selectButton.imageColor = 0xffffff;
    this.selectButton.imageDownColor = 0xffffff;
    this.selectButton.bgDownColor = 0x000000;
    this.selectButton.bgOverAlpha = 1;
    // further button color settings depend on whether it's an urgent order (see Refresh)

    this.stamp = game.make.sprite(0, 170, "approvedStamp");
    this.stamp.anchor.setTo(0.5, 0.5);
    this.sprite.addChild(this.stamp);

    this.data = null;
    this.currentPage = 0;

    // Page buttons
    var pageButtonX = this.bg.width / 2 + 20;
    this.nextPageButton = new GlassLab.HUDButton(this.game, pageButtonX, -30, null, "sideArrow", "Next", {font: "12pt EnzoBlack"}, true, this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.label.x -= 5;
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, -30, null, "sideArrow", "Prev", {font: "12pt EnzoBlack"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.bg.scale.x *= -1;
    this.prevPageButton.label.x += 5;
    this.sprite.addChild(this.prevPageButton);

    this.sprite.visible = false;
};

GlassLab.OrdersMenu.prototype._onNextPagePressed = function()
{
    this.Show(this.currentPage+1);
};

GlassLab.OrdersMenu.prototype._onPrevPagePressed = function()
{
    this.Show(this.currentPage-1);
};

GlassLab.OrdersMenu.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.OrdersMenu.prototype.Refresh = function()
{
    GlassLab.Util.SetColoredText(this.descriptionLabel, this.data.description, "#807c7b", "#994c4e");

    this.clientNameLabel.setText(this.data.client);
    this.rewardAmountLabel.setText("$"+this.data.reward);

    // For an urgent order, show the urgent stamp. Else show the title label.
    this.urgentStamp.visible = this.data.key;
    this.titleLabel.visible = !this.data.key;

    this.selectButton.bgColor = (this.data.key)? 0x9a3c3f : 0x000000;
    this.selectButton.imageOverColor = (this.data.key)? 0x9a3c3f : 0x000000;
    this.selectButton.bgAlpha = (this.data.key)? 1 : 0.5;
    this.selectButton.whenUp();

    this.selectButton.alpha = 1;
    this.stamp.visible = false;

    this.prevPageButton.visible = this.currentPage > 0;
    this.nextPageButton.visible = this.currentPage < GLOBAL.mailManager.availableOrders.length - 1;
};

GlassLab.OrdersMenu.prototype.SetInfo = function(data)
{
    this.data = data;
    this.Refresh();
};

GlassLab.OrdersMenu.prototype.Show = function(orderNum)
{
    if (!this.sprite.visible) GlassLabSDK.saveTelemEvent("open_orders", {}); // record the telemetry when we first open it

    if (typeof orderNum == 'undefined') orderNum = 0;

    this.sprite.visible = true;
    this.currentPage = orderNum;

    this.SetInfo(GLOBAL.mailManager.availableOrders[orderNum]);

    GlassLab.SignalManager.mailOpened.dispatch(orderNum);
};

GlassLab.OrdersMenu.prototype.Hide = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("close_orders", {});

    this.sprite.visible = false;

    GlassLab.SignalManager.mailClosed.dispatch();
};

GlassLab.OrdersMenu.prototype._onSelectPressed = function() {
    this.selectButton.setEnabled(false);
    this.game.add.tween(this.selectButton).to( { alpha: 0 }, 150, Phaser.Easing.Quadratic.In, true);

    this.stamp.visible = true;
    this.stamp.alpha = 0;
    this.stamp.scale.setTo(1.64, 1.64);
    this.stamp.angle = -20;
    this.game.add.tween(this.stamp).to( { alpha: 1, angle: 0 }, 250, Phaser.Easing.Quintic.In, true);
    var tween = this.game.add.tween(this.stamp.scale).to( { x: 1, y: 1 }, 250, Phaser.Easing.Quintic.In, true);
    tween.onComplete.addOnce(this._onStamped, this);
};

GlassLab.OrdersMenu.prototype._onStamped = function() {
    var startY = this.sprite.y;
    this.sprite.y += 5;
    var tween = this.game.add.tween(this.sprite).to( { y: startY }, 100, Phaser.Easing.Quadratic.InOut, true);
    tween.onComplete.addOnce( function() { GLOBAL.mailManager.startOrder(this.data); }, this );
};