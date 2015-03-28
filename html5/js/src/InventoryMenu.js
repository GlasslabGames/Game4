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

    this.items = []; // is this being used?

    /*this.bg = game.make.graphics();
    this.addChild(this.bg);
    this._onScreenSizeChange(); // sets the BG to span the whole width of the screen
    */

    // Your Funds:
    //this.bg = this.game.make.sprite(0, 0, bgSprite);
    //this.bg.anchor.setTo(0.5, 0.5);
    //this.addChild(this.bg);
    //this.bg.tint = this.bgColor;
    //this.bg.alpha = 0.5;

    // money bg
    this.inventoryMoneyBg = game.make.image(-80, -132, "inventoryMoneyBg");
    this.inventoryMoneyBg.tint = 0x000000;
    this.inventoryMoneyBg.alpha = 0.5;
    this.addChild(this.inventoryMoneyBg);

    // money coin:
    this.inventoryCoinIcon = game.make.image(-65, -117, "inventoryCoinIcon");
    this.inventoryCoinIcon.anchor.set(0.5);
    this.addChild(this.inventoryCoinIcon);

    // money text label:
    this.moneyLabel = game.make.text(-29, -115, "", {font: "16px EnzoBlack", fill: "#ffffff"});
    this.moneyLabel.anchor.set(0.5);
    this.addChild(this.moneyLabel);

    // foodbarBg:
    this.foodBarBgEndcapLeft = game.make.image(22, -100, "foodBarBgEndcap");
    this.foodBarBgEndcapLeft.alpha = 0.5;
    this.foodBarBgEndcapLeft.scale.x *= -1; // regX will now be at top-right
    this.addChild(this.foodBarBgEndcapLeft);
    this.foodBarBg = game.make.image(22, -100, "foodBarBg");
    this.foodBarBg.alpha = 0.5;
    this.foodBarBg.scale.x = 31.9;
    this.addChild(this.foodBarBg);
    this.foodBarBgEndcapRight = game.make.image(660, -100, "foodBarBgEndcap");
    this.foodBarBgEndcapRight.alpha = 0.5;
    this.addChild(this.foodBarBgEndcapRight);

    // foodbarItems:
    this.itemTable = new GlassLab.UITable(game, 10, 2);
    this.inventorySlots = [];
    for (var key in GlassLab.FoodTypes) {
        var foodInfo = GlassLab.FoodTypes[key];
        if (!foodInfo.hidden) {
            var child = new GlassLab.InventoryMenuSlot(game, key);
            this.inventorySlots.push(child);
            this.itemTable.addManagedChild(child);
        }
    }
    this.itemTable.x = 42;
    this.itemTable.y = -60;
    this.addChild(this.itemTable);
    this.itemTable._refresh();


    GlassLab.SignalManager.moneyChanged.add(this._refreshCurrency, this);

    //game.scale.onSizeChange.add(this._onScreenSizeChange, this);
};

// Extends Sprite
GlassLab.InventoryMenu.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMenu.prototype.constructor = GlassLab.InventoryMenu;

GlassLab.InventoryMenu.prototype.Refresh = function()
{
    this._refreshCurrency();
    for (var i = 0; i < this.inventorySlots.length; i++) {
        this.inventorySlots[i].Refresh();
    }
};

GlassLab.InventoryMenu.prototype._refreshCurrency = function()
{
    var money_str = GLOBAL.inventoryManager.money;
    money_str = "$" + money_str.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // i.e. makes $1,234 or $123 etc
    this.moneyLabel.setText(money_str);
};

/*
GlassLab.InventoryMenu.prototype._onScreenSizeChange = function()
{
    this.bg.clear().beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-5, -135, this.game.camera.width + 10, 150);
};
*/

GlassLab.InventoryMenu.prototype.Show = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("open_inventory", {});

    GlassLab.SignalManager.inventoryOpened.dispatch(auto === true);

    this.Refresh();

    this.visible = true;
};

GlassLab.InventoryMenu.prototype.Hide = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("close_inventory", {});

    GlassLab.SignalManager.inventoryClosed.dispatch(auto === true);

    this.visible = false;
};