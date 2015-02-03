/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenu = function(game)
{
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.visible = false;

    this.items = [];

    this.bg = game.make.graphics();
    this.bg.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-15, -15, 800, 150);
    this.addChild(this.bg);

    this.itemTable = new GlassLab.UITable(game, 5000);
    this.addChild(this.itemTable);

    var child = new GlassLab.InventoryMenuSlot(game);
    this.itemTable.addManagedChild(child);
    var child = new GlassLab.InventoryMenuSlot(game);
    this.itemTable.addManagedChild(child);
    var child = new GlassLab.InventoryMenuSlot(game);
    this.itemTable.addManagedChild(child);

    this.itemTable._refresh();
};

// Extends Sprite
GlassLab.InventoryMenu.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.InventoryMenu.prototype.constructor = Phaser.InventoryMenu;

GlassLab.InventoryMenu.prototype.Refresh = function()
{

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