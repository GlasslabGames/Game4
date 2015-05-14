/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenu = function(game)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);
    this.visible = false;
    this.anchor.setTo(0, 1);
    this.x = 100;

    // for tracking drag/drop state of any of inventory items (used to finesse onOver/onOut visual changes of items):
    this.dragging_item = false;
    this.dropped_item = false;

    this.items = []; // not certain if this is being used

    /*this.bg = game.make.graphics();
    this.addChild(this.bg);
    this._onScreenSizeChange(); // sets the BG to span the whole width of the screen
    */

    // foodBar:
    this.foodBarBg = game.make.image(2, -100, "foodBarBg");
    this.foodBarBg.alpha = 0.5;
    this.foodBarBg.scale.x = 32.9;
    this.addChild(this.foodBarBg);
    this.foodBarBgEndcapRight = game.make.image(660, -100, "foodBarBgEndcap");
    this.foodBarBgEndcapRight.alpha = 0.5;
    this.addChild(this.foodBarBgEndcapRight);

    // foodbarItems:
    this.itemTable = new GlassLab.UITable(game, 10, 4);
    this.inventorySlots = [];
    for (var key in GlassLab.FoodTypes) {
        var foodInfo = GlassLab.FoodTypes[key];
        if (!foodInfo.hidden) {
            var child = new GlassLab.InventoryMenuSlot(game, key);
            this.inventorySlots.push(child);
            this.itemTable.addManagedChild(child);
        }
    }
    this.itemTable.x = 40;
    this.itemTable.y = -60;
    this.addChild(this.itemTable);
    this.itemTable._refresh();


    //game.scale.onSizeChange.add(this._onScreenSizeChange, this);
};

// Extends Sprite
GlassLab.InventoryMenu.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMenu.prototype.constructor = GlassLab.InventoryMenu;

GlassLab.InventoryMenu.prototype.Refresh = function()
{
    if (GLOBAL.InventoryMoneyTab) GLOBAL.InventoryMoneyTab.refresh();
    for (var i = 0; i < this.inventorySlots.length; i++) {
        this.inventorySlots[i].Refresh();
    }
};

/*
GlassLab.InventoryMenu.prototype._onScreenSizeChange = function()
{
    this.bg.clear().beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-5, -135, this.game.camera.width + 10, 150);
};
*/

GlassLab.InventoryMenu.prototype.show = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("open_inventory", {});

    GlassLab.SignalManager.inventoryOpened.dispatch(auto === true);

    this.Refresh();

    this.visible = true;
    if (GLOBAL.mailManager.currentOrder == null) GLOBAL.inventoryMoneyTab.show(this);

    // Note, if we end up adding an animated open, please work out its interaction with UIManager.showInsteadOfOtherWindows()
};

GlassLab.InventoryMenu.prototype.hide = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("close_inventory", {});

    GlassLab.SignalManager.inventoryClosed.dispatch(auto === true);

    this.visible = false;
    GLOBAL.inventoryMoneyTab.stopShowing(this);
};

// Shows the current amount of money, with an effect when the player gets more money
GlassLab.InventoryMoneyTab = function(game, x, y) {
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);
    this.anchor.setTo(0, 1);

    this.open = false;
    this.openReasons = []; // keep track of why we're open so we don't close early
    this.hide();

    // money bg:
    this.bg = game.make.image(-40, 0, "inventoryMoneyBg");
    this.bg.anchor.set(0, 1);
    this.bg.tint = 0x000000;
    this.bg.alpha = 0.5;
    this.addChild(this.bg);

    // money coin:
    var coinIcon = game.make.image(-25, -15, "inventoryCoinIcon");
    coinIcon.anchor.set(0.5);
    this.addChild(coinIcon);

    // money text label:
    this.moneyLabel = game.make.text(11, coinIcon.y + 2, "", {font: "14px EnzoBlack", fill: "#ffffff"});
    this.moneyLabel.anchor.set(0.5);
    this.addChild(this.moneyLabel);

    // money added popup:
    this.moneyAddedPopup = this.addChild(game.make.sprite(0, -90));
    this.moneyAddedPopup.alpha = 0; // hide it until we want to pop it up

    var coinIcon2 = game.make.image(-25, 0, "inventoryCoinIcon");
    coinIcon2.anchor.set(0.5);
    this.moneyAddedPopup.addChild(coinIcon2);

    this.moneyAddedLabel = game.make.text(11, 2, "", {font: "14px EnzoBlack", fill: "#ffffff"});
    this.moneyAddedLabel.anchor.set(0.5);
    this.moneyAddedPopup.addChild(this.moneyAddedLabel);

    // effects
    this.effects = this.addChild(game.make.sprite(coinIcon.x + 2, coinIcon.y + 35, "coinAnim"));
    this.effects.anchor.setTo(0.5, 1); // bottom center anchor point works for both animations
    this.effects.animations.add("hop", Phaser.Animation.generateFrameNames("get_money_coin_hop_",0,37,".png",3), 24, false);
    this.effects.animations.add("sparkle", Phaser.Animation.generateFrameNames("get_money_sparkle_on_bank_",0,12,".png",3), 24, false);

    GlassLab.SignalManager.moneyChanged.add(this._onMoneyChanged, this);
};

// Extends Sprite
GlassLab.InventoryMoneyTab.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMoneyTab.prototype.constructor = GlassLab.InventoryMoneyTab;

GlassLab.InventoryMoneyTab.prototype.refresh = function()
{
    var money_str = this._formatMoney(GLOBAL.inventoryManager.money);
    GlassLab.Util.SetCenteredText(this.moneyLabel, money_str);
};

GlassLab.InventoryMoneyTab.prototype.show = function(reason)
{
    this.refresh();
    if (!this.open) {
        this.game.add.tween(this.scale).to({y: 1}, 100, Phaser.Easing.Cubic.Out, true);
    } else {
        this.scale.y = 1;
    }
    this.open = true;

    if (reason && this.openReasons.indexOf(reason) == -1) this.openReasons.push(reason);
};

// Stop showing for one reason (e.g. because we're getting money) but maybe keep showing for another reason (e.g. because the inventory is open)
GlassLab.InventoryMoneyTab.prototype.stopShowing = function(reason) {
    if (this.openReasons.indexOf(reason) != -1) this.openReasons.splice(this.openReasons.indexOf(reason), 1);
    if (!this.openReasons.length) this.hide(); // hide when we're out of reasons to stay open
};

GlassLab.InventoryMoneyTab.prototype.hide = function()
{
    if (this.open) {
        this.game.add.tween(this.scale).to({y: 0}, 100, Phaser.Easing.Cubic.In, true);
    } else {
        this.scale.y = 0;
    }
    this.open = false;
};

GlassLab.InventoryMoneyTab.prototype._onMoneyChanged = function(amount) {
    this.show("moneyChange"); // show ourselves with the reason = money

    this.refresh();
    if (amount > 0) { // add money
        // We want to play a different animation if there are flying coins coming in right now.
        var coinAnim;
        if (GLOBAL.UIManager.coinsFlying)
            coinAnim = this.effects.play("sparkle");
        else
            coinAnim = this.effects.play("hop");

        // annoying slot machine audio:
        GLOBAL.audioManager.playSoundWithVolumeAndOffset("coinDropSound", 0.15, 0.0, true);
        if (coinAnim) {
            coinAnim.onComplete.addOnce(function() {
                GLOBAL.audioManager.fadeSound("coinDropSound", 100, 0.0); // fade to volume 0.0 quickly, then stop loop.
            }, this);
        }

        // Start the popup showing how much money we got
        GlassLab.Util.SetCenteredText(this.moneyAddedLabel, "+"+this._formatMoney(amount));
        this.moneyAddedPopup.y = 0;
        var d = 1500;
        this.game.add.tween(this.moneyAddedPopup).to({alpha: 1}, 1000, Phaser.Easing.Cubic.Out, false, 0).
            to({alpha: 0}, 200, Phaser.Easing.Cubic.In, false, d - 1200).start();
        this.game.add.tween(this.moneyAddedPopup).to({y: -70}, d, Phaser.Easing.Quartic.Out, true);
    }

    // if nothing else is causing us to show, hide after 3 seconds
    if (this.hideAfterMoneyChangeTimer) this.game.time.events.remove(this.hideAfterMoneyChangeTimer); // remove the previous timer
    this.hideAfterMoneyChangeTimer = this.game.time.events.add(3000, function() { this.stopShowing("moneyChange"); }, this);
};

GlassLab.InventoryMoneyTab.prototype._formatMoney = function(money) {
    return "$" + money.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // i.e. makes $1,234 or $123 etc
};