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
    //this.sprite.addChild(this.titleLabel);

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

    this.selectButton = new GlassLab.HUDButton(this.game, 0, 168, null, "orderButtonBg", "Fill Order!", {font: "16pt EnzoBlack"}, true, function(){
        this.Hide(true);
        GLOBAL.mailManager.startOrder(this.data);
    }, this);
    this.sprite.addChild(this.selectButton);
    this.selectButton.imageColor = 0xffffff;
    this.selectButton.bgOverAlpha = 1;
    this.selectButton.whenUp();

    this.paymentLabel = game.make.text(195, 210, "$200");
    this.paymentLabel.fontSize = 22;

    this.data = null;
    this.currentPage = 0;

    // Page buttons
    var pageButtonX = this.bg.width / 2 + 20;
    this.nextPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, -30, null, "sideArrow", "Prev", {font: "12pt EnzoBlack"}, true, this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.bg.scale.x *= -1;
    this.nextPageButton.label.x += 5;
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.HUDButton(this.game, pageButtonX, -30, null, "sideArrow", "Next", {font: "12pt EnzoBlack"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.label.x -= 5;
    this.sprite.addChild(this.prevPageButton);

    this.sprite.visible = true;
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

function getProcessedString(string)
{
    var returnString = string;
    var replaceString = string.replace(/\[[^\]]+\]/i, "");
    while(returnString != replaceString)
    {
        returnString = replaceString;
        replaceString = replaceString.replace(/\[[^\]]+\]/i, "");
    }
    return returnString;
}

function getStringColorInfo(string)
{
    // TODO: This doesn't work at all right now.
    var colors = [];
    var searchString = string;
    var colorInfo = searchString.match(/\[[^\]]+\]/i);
    var colorData = {};
    while (colorInfo)
    {
        colorData.color = colorInfo;
        searchString;
        colors.add()
    }

    return colors;
}

GlassLab.OrdersMenu.prototype.Refresh = function()
{
    this.descriptionLabel.clearColors();
    this.descriptionLabel.setText(getProcessedString(this.data.description));

    this.clientNameLabel.setText(this.data.client);
    this.urgentLabel.setText(this.data.key? "Urgent!" : "");
    this.rewardAmountLabel.setText("$"+this.data.reward);

    //var maxOrders = 3; // In the future, if we want to limit the number of orders shown, do something like Math.min(GLOBAL.mailManager.availableOrders.length - 1, maxOrders).
    this.menuLabel.setText("Mail Messages "+ (this.currentPage+1) + "/" + GLOBAL.mailManager.availableOrders.length);

    var colors = getStringColorInfo(this.data.description);
    for (var i=colors.length-1; i >= 0; i++)
    {
        var color = colors[i];
        this.descriptionLabel.addColor(color.color, color.position);
    }

    this.prevPageButton.visible = this.currentPage > 0;
    this.nextPageButton.visible = this.currentPage < GLOBAL.mailManager.availableOrders.length - 1; // only show 3 orders at once
};

GlassLab.OrdersMenu.prototype.SetInfo = function(data)
{
    this.data = data;
    this.Refresh();
}

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

GlassLab.OrdersMenu.prototype._onClosePressed = function()
{
    this.Hide();
};