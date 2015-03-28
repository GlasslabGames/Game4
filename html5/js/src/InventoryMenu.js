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

    this.moneyPrefixLabel = game.make.text(20, -120, "Your Funds: ", {font: "14pt EnzoBlack"});
    this.addChild(this.moneyPrefixLabel);
    this.moneyLabel = game.make.text(this.moneyPrefixLabel.x + this.moneyPrefixLabel.getBounds().width, this.moneyPrefixLabel.y, "$0", {font: "14pt EnzoBlack"});
    this.addChild(this.moneyLabel);
    GlassLab.SignalManager.moneyChanged.add(this._refreshCurrency, this);

    this.itemTable = new GlassLab.UITable(game, 20, 10);
    this.addChild(this.itemTable);

    // Make the close button to match the inventoryMenuSlots (this could be done more robustly)
    /*
    this.closeButton = new GlassLab.UIButton(this.game, 0,0,"inventoryClose", this.Hide, this);
    this.closeButton.scale.setTo(.8, .8);
    this.closeButton.anchor.setTo(0.5, 0.5);
    this.itemTable.addManagedChild(this.closeButton);

    var label = game.make.text(0, this.closeButton.height / 2,"close", {fill: '#ffffff', font: "bold 10.5pt Arial"});
    label.anchor.setTo(.5, 1);
    this.closeButton.addChild(label);*/

    this.inventorySlots = [];

    for (var key in GlassLab.FoodTypes)
    {
        var foodInfo = GlassLab.FoodTypes[key];
        if (!foodInfo.hidden)
        {
            var child = new GlassLab.InventoryMenuSlot(game, key);
            this.inventorySlots.push(child);
            this.itemTable.addManagedChild(child);
        }
    }

    this.itemTable._refresh();
    this.itemTable.x = 55;
    this.itemTable.y = -55;

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