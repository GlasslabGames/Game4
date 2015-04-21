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

    // Note, if we end up adding an animated open, please work out its interaction with UIManager.showInsteadOfOtherWindows()
};

GlassLab.InventoryMenu.prototype.hide = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("close_inventory", {});

    GlassLab.SignalManager.inventoryClosed.dispatch(auto === true);

    this.visible = false;
};

// Shows the current amount of money, with an effect when the player gets more money
GlassLab.InventoryMoneyTab = function(game, x, y) {
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);
    this.anchor.setTo(0, 1);

    // money bg:
    this.bg = game.make.image(-40, -132, "inventoryMoneyBg");
    this.bg.tint = 0x000000;
    this.bg.alpha = 0.5;
    this.addChild(this.bg);

    // money coin:
    var coinIcon = game.make.image(-25, -117, "inventoryCoinIcon");
    coinIcon.anchor.set(0.5);
    this.addChild(coinIcon);

    // money text label:
    this.moneyLabel = game.make.text(11, -115, "", {font: "14px EnzoBlack", fill: "#ffffff"});
    this.moneyLabel.anchor.set(0.5);
    this.addChild(this.moneyLabel);

    // money added popup:
    this.moneyAddedPopup = this.addChild(game.make.sprite());
    // TODO

    GlassLab.SignalManager.moneyChanged.add(this.refresh, this);
};

// Extends Sprite
GlassLab.InventoryMoneyTab.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMoneyTab.prototype.constructor = GlassLab.InventoryMoneyTab;


GlassLab.InventoryMoneyTab.prototype.refresh = function()
{
    var money_str = GLOBAL.inventoryManager.money;
    money_str = "$" + money_str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // i.e. makes $1,234 or $123 etc
    this.moneyLabel.setText(money_str);
    this.moneyLabel.anchor.x = Math.round(this.moneyLabel.width * 0.5) / this.moneyLabel.width; // round to avoid subpixel blur
    this.moneyLabel.anchor.y = Math.round(this.moneyLabel.height * 0.5) / this.moneyLabel.height; // round to avoid subpixel blur

};