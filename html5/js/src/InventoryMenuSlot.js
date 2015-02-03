/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game)
{
    Phaser.Sprite.prototype.constructor.call(this, game, 0, 0, "carrot");

    this.anchor.setTo(0, 0);
    this.scale.setTo(0.5, .5);

    this.inputEnabled = true;
    this.input.enableDrag(true);

    this._dragStartLocation = new Phaser.Point();

    this.locked = true;
    this.canInteract = true;

    this.events.onInputDown.add(this._onDragStart, this);
    this.events.onDragStop.add(this._onDragStop, this);
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
    var target = pointer.targetObject;
    // Dropped on something
    var tile = GLOBAL.tileManager.TryGetTileAtWorldPosition(pointer.worldX, pointer.worldY);
    if (target)
    {
        if(tile) // valid target
        {
            var carrot = new GlassLab.Food(this.game, "carrot");
            carrot.sprite.isoX = tile.isoX;
            carrot.sprite.isoY = tile.isoY;
            GLOBAL.WorldLayer.add(carrot.sprite);

            this.position.setTo(this._dragStartLocation.x, this._dragStartLocation.y);
        }
        else
        {
            // TODO: Recycle tween

            if (!this.returnTween)
            {
                this.returnTween = this.game.add.tween(this).to( {x: this._dragStartLocation.x, y: this._dragStartLocation.y}, 500, Phaser.Easing.Cubic.Out, true);
            }
            else
            {
                this.returnTween.start();
            }
        }
    }
    else // dropped in world
    {
        // move back to original position
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