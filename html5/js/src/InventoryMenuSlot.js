/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIDraggable.prototype.constructor.call(this, game, 0, 0);

    this.anchor.setTo(0, 0);

    this.events.onInputDown.add(this._onInputDown, this);
    this.events.onEndDrag.add(this._onEndDrag, this);

    this.costLabel = game.make.text(0,0,"$"+this.data.cost, {fill: '#ffffff'});
    this.costLabel.anchor.setTo(.5, 1);
    this.addChild(this.costLabel);

    this.Refresh();
};

// Extends Sprite
GlassLab.InventoryMenuSlot.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.InventoryMenuSlot.prototype.constructor = GlassLab.InventoryMenuSlot;

GlassLab.InventoryMenuSlot.prototype._onInputDown = function(sprite, pointer)
{
    if (!this.data.unlocked) {
        if (!this.modal)
        {
            var yesButton = new GlassLab.UIButton(this.game, 0, 0, this._onPurchaseConfirmed, this, 150, 60, 0xffffff, "Yes");
            var noButton = new GlassLab.UIButton(this.game, 0, 0, this._onPurchaseCanceled, this, 150, 60, 0xffffff, "No");

            this.modal = new GlassLab.UIModal(this.game, "Purchase for $"+this.data.cost + "?", [yesButton, noButton]);
            GLOBAL.UIManager.centerAnchor.addChild(this.modal);
        }

        this.modal.visible = true;
    }
};

GlassLab.InventoryMenuSlot.prototype._onPurchaseConfirmed = function()
{
    if (GLOBAL.inventoryManager.TrySpendMoney(this.data.cost))
    {
        this.data.unlocked = true;
        this.Refresh();
        this.modal.visible = false;
    }
    else
    {
        // Failed, not enough money
    }
};

GlassLab.InventoryMenuSlot.prototype._onPurchaseCanceled = function()
{
    if (this.modal)
    {
        this.modal.visible = false;
    }
};

GlassLab.InventoryMenuSlot.prototype._jumpToStart = function() {
    this.position.setTo(this.dragStartPoint.x, this.dragStartPoint.y); // jump back into the inventory
};

GlassLab.InventoryMenuSlot.prototype._onEndDrag = function(target)
{
    if (target) { // we dropped it on an acceptable uiDragTarget
        this._jumpToStart(); // move the sprite back
        return;
    }

    // Dropped on world
    var pointer = this.game.input.activePointer;
    var tile = GLOBAL.tileManager.TryGetTileAtWorldPosition(pointer.worldX, pointer.worldY);
    if (tile && tile.canDropFood()) { // valid tile
            var food = new GlassLab.Food(this.game, this.foodType);
            GLOBAL.foodLayer.add(food.sprite);
            food.placeOnTile(tile);

        GlassLabSDK.saveTelemEvent("place_food", {food_type: this.foodType, column: tile.col, row: tile.row});

        this._jumpToStart();
    }
    else  if (tile && tile.inPen && tile.inPen.tryDropFood && tile.inPen.tryDropFood(this.foodType, tile)) {
        this._jumpToStart();
    }
    // else, it will fly back thanks to uiDraggable
};

GlassLab.InventoryMenuSlot.prototype.SetData = function(data)
{
    this.data = data;
    this.Refresh();
};

GlassLab.InventoryMenuSlot.prototype.Refresh = function()
{
    if (this.data.unlocked)
    {
        this.costLabel.visible = false;
        this.loadTexture(this.data.spriteName);
        this.scale.setTo(.5, .5);

        /*if (!this.input.draggable)
        {
            this.input.enableDrag(false, true);

            this.events.onDragStop.add(this._onDragStop, this);
        }*/
        this.draggable = true;
    }
    else
    {
        this.loadTexture("lock");
        this.scale.setTo(1, 1);
        this.costLabel.visible = true;
        this.costLabel.setText("$"+this.data.cost);
        this.costLabel.x = this.width/2;
        this.costLabel.y = this.height;

        /*if (this.input.draggable)
        {
            this.input.disableDrag();

            this.events.onDragStop.remove(this._onDragStop, this);
        }*/
        this.draggable = false;
    }

    this._signalChange();
};
