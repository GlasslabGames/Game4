/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.OrdersMenu = function(game, x, y) {
    GlassLab.UIWindow.prototype.constructor.call(this, game);
    this.sprite = game.make.sprite(x, y);
    this.addChild(this.sprite);

    this.bg = game.make.sprite(0, 0, "letterBg");
    this.bg.anchor.setTo(0.5, 0.5);
    this.bg = GlassLab.Util.PixelSnapAnchor(this.bg);
    this.sprite.addChild(this.bg);

    this.portrait = game.make.sprite(-95, -150, "clientPhoto3");
    this.portrait.anchor.setTo(.5, .5);
    this.portrait = GlassLab.Util.PixelSnapAnchor(this.portrait);
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

    this.descriptionLabel = game.make.text(-165, -40, "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent maximus, risus quis dignissim lacinia, tellus eros facilisis nulla, vulputate laoreet erat nisl sit amet sem. Nam eget est a erat rhoncus consequat.",
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
    var pageButtonX = Math.round(this.bg.width/2) + 20;
    this.nextPageButton = new GlassLab.HUDButton(this.game, pageButtonX, 0, null, "sideArrow", "Next", {font: "12pt EnzoBlack", align: "left"}, true, this._onNextPagePressed, this);
    this.nextPageButton.label = GlassLab.Util.SetCenteredText(this.nextPageButton.label, null, 0, 0);
    this.nextPageButton.label.x -= Math.round(this.nextPageButton.label.width / 2) + 8;
    this.nextPageButton.label.y -= Math.round(this.nextPageButton.label.height / 2) - 1;
    this.nextPageButton.addOutline("sideArrowHighlight");
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, 0, null, "sideArrow", "Prev", {font: "12pt EnzoBlack", align: "right"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.label = GlassLab.Util.SetCenteredText(this.prevPageButton.label, null, 0, 0);
    this.prevPageButton.label.x -= Math.round(this.prevPageButton.label.width / 2) - 8;
    this.prevPageButton.label.y -= Math.round(this.prevPageButton.label.height / 2) - 1;
    this.prevPageButton.addOutline("sideArrowHighlight");
    this.prevPageButton.outline.scale.x = -1;
    this.prevPageButton.bg.scale.x *= -1;
    this.sprite.addChild(this.prevPageButton);

    // If there's no mail, we show a totally different popup
    this.noMailPopup = this.game.make.sprite();
    this.addChild(this.noMailPopup);
    var sprite = this.noMailPopup.addChild(this.game.make.sprite(0, -50, "noMailPopup"));
    sprite.anchor.setTo(0.5, 0.5);
    var label = sprite.addChild(this.game.make.text(85, 0, "Looks like your mailbox\nis empty!", {font: "14pt EnzoBlack", fill: "#cccccc"}));
    GlassLab.Util.PixelSnapAnchor(label);
    label.anchor.setTo(0.5, 0.5);
};

GlassLab.OrdersMenu.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.OrdersMenu.prototype.constructor = GlassLab.OrdersMenu;

GlassLab.OrdersMenu.prototype._onNextPagePressed = function()
{
    this.currentPage += 1;
    this.SetInfo(GLOBAL.mailManager.availableOrders[this.currentPage]);

    GLOBAL.audioManager.playSound("pageTurnSound");
};

GlassLab.OrdersMenu.prototype._onPrevPagePressed = function()
{
    this.currentPage -= 1;
    this.SetInfo(GLOBAL.mailManager.availableOrders[this.currentPage]);

    GLOBAL.audioManager.playSound("pageTurnSound");
};

GlassLab.OrdersMenu.prototype.Refresh = function()
{
    var text = this.data.description;

    // replace any sections like [numCreatures] or [creatureType] with the data.
    var pattern = /\[([^\[]+)\]/;
    var m = pattern.exec(text);

    while (m) {
        var match = m[0], key = m[1];
        var entry = "ERROR";
        // we might have to look up the entry if it's a food type
        if (key.indexOf("foodType") > -1) {
            var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood;
            var food = (key.indexOf("B") > -1)? desiredFood[1] : desiredFood[0];
            if (food && GlassLab.FoodTypes[food.type]) entry = GlassLab.FoodTypes[food.type].displayNames.plural.toLowerCase();
        } else if (key in this.data && key != "description") {
            entry = this.data[key]; // else check in the data for anything else

            if (entry in GLOBAL.creatureManager.creatureDatabase) {
                entry = GLOBAL.creatureManager.GetCreatureName(entry, true);
            }
        }
        text = text.slice(0, m.index) + entry + text.slice(m.index + match.length);
        m = pattern.exec(text);
    }

    GlassLab.Util.SetColoredText(this.descriptionLabel, text, "#807c7b", "#994c4e");

    var clientNames = ["Elias Petters", "Lyda Ross", "Isabel Noether", "Marmaduke Biggs"]; // this order corresponds to the photo order as loaded by InitializationState
    var clientIndex = clientNames.indexOf(this.data.client);
    if (clientIndex > -1) {
        this.portrait.loadTexture("clientPhoto"+clientIndex);
    } else {
        console.error("There's no photo that matches",this.data.client);
        // and just keep the same photo as last time
    }

    this.clientNameLabel.setText(this.data.client);
    this.rewardAmountLabel.setText("$"+this.data.reward);

    // For an urgent order, show the urgent stamp. Else show the title label.
    this.urgentStamp.visible = this.data.key;
    this.titleLabel.visible = !this.data.key;

    this.selectButton.bgColor = (this.data.key)? 0x9a3c3f : 0x000000;
    this.selectButton.imageOverColor = (this.data.key)? 0x9a3c3f : 0x000000;
    this.selectButton.bgAlpha = (this.data.key)? 1 : 0.5;
    this.selectButton.alpha = 1;
    this.selectButton.whenUp(); // refresh
    this.selectButton.setEnabled(true);

    this.stamp.visible = false;

    this.prevPageButton.setEnabled(this.currentPage > 0);
    this.nextPageButton.setEnabled(this.currentPage < GLOBAL.mailManager.availableOrders.length - 1);
};

GlassLab.OrdersMenu.prototype.SetInfo = function(data)
{
    this.data = data;
    this.Refresh();
};

GlassLab.OrdersMenu.prototype.show = function(orderNum)
{
    GlassLab.UIWindow.prototype.show.call(this);
    GlassLabSDK.saveTelemEvent("open_orders", {}); // record the telemetry when we first open it

    // Show either the no mail popup or the actual orders, depending on whether we have mail to show
    this.sprite.visible = GLOBAL.mailManager.availableOrders.length;
    this.noMailPopup.visible = !GLOBAL.mailManager.availableOrders.length;
    if (GLOBAL.mailManager.availableOrders.length) {
        if (typeof orderNum == 'undefined') orderNum = 0;

        this.currentPage = orderNum;

        this.SetInfo(GLOBAL.mailManager.availableOrders[orderNum]);
    }

    GlassLab.SignalManager.mailOpened.dispatch(orderNum);
};

GlassLab.OrdersMenu.prototype.hide = function(auto)
{
    GlassLab.UIWindow.prototype.hide.call(this);
    GlassLabSDK.saveTelemEvent("close_orders", {});

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

    GLOBAL.audioManager.playSound("orderAcceptedSound");

    var startY = this.sprite.y;
    this.sprite.y += 5;
    var tween = this.game.add.tween(this.sprite).to( { y: startY }, 100, Phaser.Easing.Quadratic.InOut, true);
    tween.onComplete.addOnce( function() { GLOBAL.mailManager.startOrder(this.data); }, this );
};