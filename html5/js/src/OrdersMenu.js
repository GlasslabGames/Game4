/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.OrdersMenu = function(game, x, y) {
    this.game = game;
    this.sprite = game.make.sprite();
    this.sprite.x = x;
    this.sprite.y = y;

    this.bg = game.make.graphics();
    this.sprite.addChild(this.bg);
    this.bg.beginFill(0xffffff).lineStyle(3, 0x000000, 1).drawRect(0, 0, 280, 30).drawRect(0,30,280,320);

    this.menuLabel = game.make.text(this.bg.width/2, 2, "Order 1/3", {font: 'bold 16pt Arial'});
    this.menuLabel.anchor.setTo(.5, 0);
    this.sprite.addChild(this.menuLabel);

    this.data = null;

    this.portraitFrame = game.make.graphics();
    this.portraitFrame.beginFill(0xffffff).lineStyle(2, 0x000000).drawRect(0, 0, 80, 100);
    var portraitAlert = game.make.sprite(0,0,"alertIcon");
    portraitAlert.anchor.setTo(.5,.5);
    portraitAlert.scale.setTo(.5,.5);
    this.portraitFrame.addChild(portraitAlert);
    this.portraitFrame.x = 18;
    this.portraitFrame.y = 48;
    this.sprite.addChild(this.portraitFrame);

    this.portrait = game.make.sprite(this.portraitFrame.width/2, this.portraitFrame.height/2, "assistantIcon");
    this.portrait.anchor.setTo(.5, .5);
    this.portrait.scale.setTo(.5, .5);
    this.portraitFrame.addChild(this.portrait);

    this.clientLabel = game.make.text(120,40, "Client:", {font: 'bold 10pt Arial'});
    this.sprite.addChild(this.clientLabel);
    this.clientNameLabel = game.make.text(this.clientLabel.x+5,this.clientLabel.y + this.clientLabel.height, "{clientName}", {font: '10pt Arial'});
    this.sprite.addChild(this.clientNameLabel);

    this.urgentLabel = game.make.text(120,78, "Urgent!", {font: 'bold 10pt Arial', fill: '#ff0000'});
    this.sprite.addChild(this.urgentLabel);

    this.rewardLabel = game.make.text(120,115, "Payment:", {font: 'bold 10pt Arial'});
    this.sprite.addChild(this.rewardLabel);
    this.rewardAmountLabel = game.make.text(this.rewardLabel.x+5, this.rewardLabel.y + this.rewardLabel.height, "{rewardAmount}", {font: '10pt Arial'});
    this.sprite.addChild(this.rewardAmountLabel);

    this.descriptionLabel = game.make.text(15, 160, "", {wordWrap: true, wordWrapWidth: 250, font:"bold 10pt Arial"});
    this.sprite.addChild(this.descriptionLabel);

    this.selectButton = new GlassLab.UIButton(this.game, this.bg.width/2, this.bg.height - 50, "selectOrderButton", function(){
        this.Hide(true);
        GLOBAL.mailManager.startOrder(this.data);
    }, this);
    this.selectButton.scale.setTo(.65,.65);
    this.selectButton.anchor.setTo(.5, .5);
    this.sprite.addChild(this.selectButton);

    this.paymentLabel = game.make.text(195, 210, "$200");
    this.paymentLabel.fontSize = 22;

    this.currentPage = 0;
    //this.sprite.addChild(this.paymentLabel);

    this.closeButton = new GlassLab.UIButton(this.game, this.bg.width-17, 15, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(.5, .5);
    this.closeButton.scale.setTo(.1, .1);
    this.sprite.addChild(this.closeButton);

    // Page buttons
    this.nextPageButton = new GlassLab.UIButton(this.game, this.bg.width + 10, 200, "sideArrow" , this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.scale.setTo(0.7, 0.7);
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.UIButton(this.game, -10, 200, "sideArrow" , this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.scale.setTo(0.7, 0.7);
    this.prevPageButton.scale.x *= -1;
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