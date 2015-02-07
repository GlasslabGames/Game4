/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenu = function(game)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);
    this.visible = false;

    this.items = [];

    this.bg = game.make.graphics();
    this.bg.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-15, -15, 550, 150);
    this.addChild(this.bg);

    this.moneyPrefixLabel = game.make.text(100,0,"Your Funds: $");
    this.addChild(this.moneyPrefixLabel);
    this.moneyLabel = game.make.text(this.moneyPrefixLabel.x + this.moneyPrefixLabel.getBounds().width,0,"1000");
    this.addChild(this.moneyLabel);
    GlassLab.SignalManager.moneyChanged.add(this._refreshCurrency, this);

    this.itemTable = new GlassLab.UITable(game, 5000, 5);
    this.addChild(this.itemTable);

    for (var key in GlassLab.FoodTypes)
    {
        var foodType = GlassLab.FoodTypes[key];
        if (!foodType.hidden)
        {
            var child = new GlassLab.InventoryMenuSlot(game, foodType);
            this.itemTable.addManagedChild(child);
        }
    }

    this.itemTable._refresh();
    this.itemTable.x = 100;
    this.itemTable.y = 50;

    this.closeButton = game.make.button(0,50,"closeIcon", this.Hide, this);
    this.closeButton.scale.setTo(.25, .25);
    this.addChild(this.closeButton);
};

// Extends Sprite
GlassLab.InventoryMenu.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMenu.prototype.constructor = GlassLab.InventoryMenu;

GlassLab.InventoryMenu.prototype.Refresh = function()
{
    this._refreshCurrency();
};

GlassLab.InventoryMenu.prototype._refreshCurrency = function()
{
    this.moneyLabel.setText(GLOBAL.inventoryManager.money);
};

GlassLab.InventoryMenu.prototype.Show = function()
{
    this.Refresh();

    this.visible = true;
};

GlassLab.InventoryMenu.prototype.Hide = function()
{
    this.visible = false;
};