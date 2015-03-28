/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIElement.prototype.constructor.call(this, game, 0, 0);

    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(0.8, 0.8);

    this.inputEnabled = true;
    this.events.onInputDown.add(this._onInputDown, this);

    this.loadTexture("inventoryBg");

    this.foodSprite = new GlassLab.InventoryMenuItem(this.game, this.foodType);
    this.foodSprite.y = -10;
    this.addChild(this.foodSprite);

    this.label = game.make.text(0, this.height / 2,"$"+this.data.cost, {fill: '#ffffff', font: "bold 10.5pt Arial"});
    this.label.anchor.setTo(.5, 1);
    this.addChild(this.label);

    this.Refresh();
};

// Extends Sprite
GlassLab.InventoryMenuSlot.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMenuSlot.prototype.constructor = GlassLab.InventoryMenuSlot;

GlassLab.InventoryMenuSlot.prototype._onInputDown = function(sprite, pointer)
{
    if (!this.data.unlocked && this.data.cost > 0) {
        if (!this.modal)
        {
            var yesButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onPurchaseConfirmed, this, 150, 60, 0xffffff, "Yes");
            var noButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onPurchaseCanceled, this, 150, 60, 0xffffff, "No");

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
        GLOBAL.inventoryManager.unlock(this.foodType); // if we don't actually call unlock(), the unlock won't be saved
        GLOBAL.saveManager.Save(); // save when we unlock food
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

GlassLab.InventoryMenuSlot.prototype.Refresh = function()
{
    if (this.data.unlocked)
    {
        this.loadTexture("inventoryBg");
        this.label.visible = true;
        this.label.setText(this.data.displayNames["singular"]);
        this.label.style.fill = '#000000';
        this.foodSprite.visible = true;
    }
    else
    {
        this.loadTexture("inventoryLock");
        if (this.data.cost > 0) {
            this.label.visible = true;
            this.label.setText("$"+this.data.cost);
            this.label.style.fill = '#ffffff';
        } else {
            this.label.visible = false;
        }
        this.foodSprite.visible = false;
    }

    this._signalChange();
};

// This is the piece that actually gets dragged out
GlassLab.InventoryMenuItem = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIDraggable.prototype.constructor.call(this, game, 0, 0);

    this.events.onEndDrag.add(this._onEndDrag, this);

    this.loadTexture( this.data.spriteName );
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(0.25, 0.25);
};

GlassLab.InventoryMenuItem.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.InventoryMenuItem.prototype.constructor = GlassLab.InventoryMenuItem;

GlassLab.InventoryMenuItem.prototype._onEndDrag = function(target)
{
    GLOBAL.audioManager.playSound("click"); // generic interaction sound

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
        GlassLab.SignalManager.foodDropped.dispatch(food); // we should have this before targetsChanged
        GlassLab.SignalManager.creatureTargetsChanged.dispatch();

        this._jumpToStart();
    }
    else  if (tile && tile.inPen && tile.inPen.tryDropFood && tile.inPen.tryDropFood(this.foodType, tile)) {
        this._jumpToStart();
    }
    // else, it will fly back thanks to uiDraggable
};

GlassLab.InventoryMenuItem.prototype._jumpToStart = function() {
    this.position.setTo(this.dragStartPoint.x, this.dragStartPoint.y); // jump back into the inventory
};