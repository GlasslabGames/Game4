/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIElement.prototype.constructor.call(this, game, 0, 0);

    this.anchor.setTo(0, 0);

    this._dragStartLocation = new Phaser.Point();

    this.canInteract = true;

    this.inputEnabled = true;
    this.events.onInputDown.add(this._onInputDown, this);

    this.costLabel = game.make.text(0,0,"$"+this.data.cost, {fill: '#ffffff'});
    this.costLabel.anchor.setTo(.5, 1);
    this.addChild(this.costLabel);

    this.Refresh();
};

// Extends Sprite
GlassLab.InventoryMenuSlot.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.InventoryMenuSlot.prototype.constructor = GlassLab.InventoryMenuSlot;

GlassLab.InventoryMenuSlot.prototype._onInputDown = function(sprite, pointer)
{
    if (this.data.unlocked)
    {
        this._dragStartLocation.set(this.x, this.y);
    }
    else
    {
        if (!this.modal)
        {
            var yesButton = new GlassLab.UIButton(this.game, 0, 0, this._onPurchaseConfirmed, this, 150, 60, 0xffffff, "Yes");
            var noButton = new GlassLab.UIButton(this.game, 0, 0, this._onPurchaseCanceled, this, 150, 60, 0xffffff, "No");

            this.modal = new GlassLab.UIModal(this.game, "Purchase for $"+this.data.cost + "?", [yesButton, noButton]);
            GLOBAL.uiAnchors.center.addChild(this.modal);
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

GlassLab.InventoryMenuSlot.prototype._onDragStop = function(sprite, pointer)
{
    // Dropped on world
    var tile = GLOBAL.tileManager.TryGetTileAtWorldPosition(pointer.worldX, pointer.worldY);
    if (tile && tile.canDropFood()) { // valid tile
            var food = new GlassLab.Food(this.game, this.foodType);
            GLOBAL.foodLayer.add(food.sprite);
            food.placeOnTile(tile);

        this.position.setTo(this._dragStartLocation.x, this._dragStartLocation.y);
    }
    else  if (tile.inPen && tile.inPen.tryDropFood && tile.inPen.tryDropFood(this.foodType, tile)) {
        this.position.setTo(this._dragStartLocation.x, this._dragStartLocation.y);
    } else {// failed
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
    if (this.data.unlocked)
    {
        this.costLabel.visible = false;
        this.loadTexture(this.data.spriteName);
        this.scale.setTo(.5, .5);

        if (!this.input.draggable)
        {
            this.input.enableDrag(false, true);

            this.events.onDragStop.add(this._onDragStop, this);
        }
    }
    else
    {
        this.loadTexture("lock");
        this.scale.setTo(1, 1);
        this.costLabel.visible = true;
        this.costLabel.setText("$"+this.data.cost);
        this.costLabel.x = this.width/2;
        this.costLabel.y = this.height;

        if (this.input.draggable)
        {
            this.input.disableDrag();

            this.events.onDragStop.remove(this._onDragStop, this);
        }
    }

    this._signalChange();
};
