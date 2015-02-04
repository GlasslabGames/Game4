/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodData)
{
    this.data = foodData;
    Phaser.Sprite.prototype.constructor.call(this, game, 0, 0, this.data.unlocked ? this.data.spriteName : "lock");

    this.anchor.setTo(0, 0);
    this.scale.setTo(0.5, .5);

    this._dragStartLocation = new Phaser.Point();

    this.canInteract = true;

    if (this.data.unlocked)
    {
        this.inputEnabled = true;
        this.input.enableDrag(true);

        this.events.onInputDown.add(this._onDragStart, this);
        this.events.onDragStop.add(this._onDragStop, this);
    }

    this.costLabel = game.make.text(0,0,"$"+this.data.cost, {fill: (this.data.unlocked ? '#000000' : '#ffffff')});
    this.addChild(this.costLabel);
};

// Extends Sprite
GlassLab.InventoryMenuSlot.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.InventoryMenuSlot.prototype.constructor = Phaser.InventoryMenuSlot;

GlassLab.InventoryMenuSlot.prototype._onDragStart = function(sprite, pointer)
{
    this._dragStartLocation.set(this.x, this.y);
};

GlassLab.InventoryMenuSlot.prototype._onDragStop = function(sprite, pointer)
{
    // Dropped on world
    var tile = GLOBAL.tileManager.TryGetTileAtWorldPosition(pointer.worldX, pointer.worldY);
    if (tile && // valid tile
        GLOBAL.inventoryManager.TrySpendMoney(this.data.cost)) // valid funds
    {
            var food = new GlassLab.Food(this.game, this.data.spriteName);
            food.sprite.isoX = tile.isoX;
            food.sprite.isoY = tile.isoY;
            GLOBAL.WorldLayer.add(food.sprite);

            this.position.setTo(this._dragStartLocation.x, this._dragStartLocation.y);
    }
    else // failed
    {
        if (!this.returnTween)
        {
            this.returnTween = this.game.add.tween(this).to( {x: this._dragStartLocation.x, y: this._dragStartLocation.y}, 500, Phaser.Easing.Cubic.Out, true);
        }
        else
        {
            this.returnTween.start();
        }
    }
};

GlassLab.InventoryMenuSlot.prototype.SetData = function(data)
{
    this.data = data;
    this.Refresh();
};

GlassLab.InventoryMenuSlot.prototype.Refresh = function()
{

};