/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIElement.prototype.constructor.call(this, game, 0, 0);

    // prettify the cost:
    this.cost_display = "???";
    if (this.data.cost > 0)
        this.cost_display = "$" + this.data.cost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // i.e. makes $1,234 or $123 etc

    // set other props:
    this.anchor.setTo(0.5, 0.5);
    this.inputEnabled = true;

    // bg:
    this.loadTexture("foodItemEmptyTexture"); // don't need this, except to set dimensions.  hmmph - another way?

    // set hitArea to just the bg texture rect, so other children dont get checked for input events.
    this.hitArea = new Phaser.Rectangle(0 - this.texture.width/2, 0 - this.texture.height/2, this.texture.width, this.texture.height);

    // bg sprite:
    this.bgSprite = this.game.make.sprite(0, 0, "foodItemBg");
    this.bgSprite.anchor.setTo(0.5, 0.5);
    this.bgSprite.tint = 0x000000;
    this.bgSprite.alpha = 0.5;
    this.addChild(this.bgSprite);

    // slot image:
    this.foodSprite = new GlassLab.InventoryMenuItem(this.game, this.foodType);
    this.addChild(this.foodSprite);

    // locked slot image (coin):
    this.coinSprite = this.game.make.sprite(0, 0, "inventoryCoin");
    this.coinSprite.anchor.setTo(0.5, 0.75);
    this.coinSprite.alpha = 1;
    this.coinSprite.visible = false;
    this.addChild(this.coinSprite);

    // cost:
    this.label = game.make.text(0, this.height / 2, this.cost_display, {fill: '#ffffff', font: "14px EnzoBlack"});
    this.label.anchor.setTo(.5, 1);
    this.label.anchor.x = Math.round(this.label.width * 0.5) / this.label.width; // round to avoid subpixel blur
    this.addChild(this.label);

    // hoverLabel above slot (show on hover):
    var hoverLabelY = Math.round((this.height / -2)) - 34; // 34px above top edge of slot

    this.hoverLabel = game.make.text(0, hoverLabelY + 2, this.data.displayNames["singular"], {fill: '#ffffff', font: "16px EnzoBlack"});
    this.hoverLabel.anchor.x = Math.round(this.hoverLabel.width * 0.5) / this.hoverLabel.width; // round to avoid subpixel blur
    this.hoverLabel.anchor.y = Math.round(this.hoverLabel.height * 0.5) / this.hoverLabel.height; // round to avoid subpixel blur
    this.hoverLabel.alpha = 0;

    this.hoverLabelBg = this.game.make.image(0, hoverLabelY, "foodLabelBg");
    this.hoverLabelBg._original_width = this.hoverLabelBg.width;
    this.hoverLabelBg.anchor.setTo(.5, .5);
    this.hoverLabelBg.alpha = 0;
    this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
    this.hoverLabelBg.tint = 0x000000;

    this.hoverLabelBgEndcapLeft = this.game.make.image(0 - (this.hoverLabel.width/2 + 15), hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapLeft.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapLeft.alpha = 0;
    this.hoverLabelBgEndcapLeft.tint = 0x000000;

    this.hoverLabelBgEndcapRight = this.game.make.image((this.hoverLabel.width/2 + 15), hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapRight.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapRight.alpha = 0;
    this.hoverLabelBgEndcapRight.scale.x *= -1;
    this.hoverLabelBgEndcapRight.tint = 0x000000;

    // add hoverLabel parts as children:
    this.addChild(this.hoverLabelBg);
    this.addChild(this.hoverLabelBgEndcapLeft);
    this.addChild(this.hoverLabelBgEndcapRight);
    this.addChild(this.hoverLabel);


    // mouse events:
    this.events.onInputDown.add(this._onInputDown, this);
    this.events.onInputOver.add(this._onOver, this);
    this.events.onInputOut.add(this._onOut, this);

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

            this.modal = new GlassLab.UIModal(this.game, "Purchase for " + this.cost_display + "?", [yesButton, noButton]);
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
        this.bgSprite.alpha = 0.5;
        this.foodSprite.visible = true;
        this.coinSprite.visible = false;
        this.label.visible = false;

        // hover label adjustments:
        this.hoverLabel.setText(this.data.displayNames["singular"]);
        this.hoverLabel.anchor.x = Math.round(this.hoverLabel.width * 0.5) / this.hoverLabel.width; // round to avoid subpixel blur
        this.hoverLabel.anchor.y = Math.round(this.hoverLabel.height * 0.5) / this.hoverLabel.height; // round to avoid subpixel blur
        this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
        this.hoverLabelBgEndcapLeft.x = 0 - (this.hoverLabel.width/2 + 15);
        this.hoverLabelBgEndcapRight.x = this.hoverLabel.width/2 + 15;
    }
    else
    {
        if (this.data.cost > 0) {
            this.bgSprite.alpha = 0.75;
            this.coinSprite.visible = true;
            this.coinSprite.alpha = 1;
            this.label.visible = true;
            this.label.setText(this.cost_display);
            this.label.style.fill = '#cccccc';
            this.label.alpha = 1;

            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.coinSprite.alpha = 0.25;
                this.label.alpha = 0.25;

                // hover label adjustments:
                this.hoverLabel.setText("Need more $$$");
                this.hoverLabel.anchor.x = Math.round(this.hoverLabel.width * 0.5) / this.hoverLabel.width; // round to avoid subpixel blur
                this.hoverLabel.anchor.y = Math.round(this.hoverLabel.height * 0.5) / this.hoverLabel.height; // round to avoid subpixel blur
                this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
                this.hoverLabelBgEndcapLeft.x = 0 - (this.hoverLabel.width/2 + 15);
                this.hoverLabelBgEndcapRight.x = this.hoverLabel.width/2 + 15;
            }
            else {
                // can afford!

                // hover label adjustments:
                this.hoverLabel.setText("Unlock " + this.data.displayNames["singular"]);
                this.hoverLabel.anchor.x = Math.round(this.hoverLabel.width * 0.5) / this.hoverLabel.width; // round to avoid subpixel blur
                this.hoverLabel.anchor.y = Math.round(this.hoverLabel.height * 0.5) / this.hoverLabel.height; // round to avoid subpixel blur
                this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
                this.hoverLabelBgEndcapLeft.x = 0 - (this.hoverLabel.width/2 + 15);
                this.hoverLabelBgEndcapRight.x = this.hoverLabel.width/2 + 15;
            }
        }
        else {
            this.label.visible = false;
        }
        this.foodSprite.visible = false;
    }

    this._signalChange();
};

GlassLab.InventoryMenuSlot.prototype.Highlight = function(yes_or_no) {
    if (yes_or_no) {
        this.bgSprite.tint = 0xffffff;
        
        this.label.tint = 0x4d4d4d; //this.label.style.fill = '#4d4d4d';

        this.hoverLabelBg.alpha = 0.5;
        this.hoverLabelBgEndcapLeft.alpha = 0.5;
        this.hoverLabelBgEndcapRight.alpha = 0.5;
        this.hoverLabel.alpha = 1;

        if (this.data.cost > 0) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.5;
                this.bgSprite.tint = 0x000000;
                this.label.alpha = 1;
                this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';
            }
        }
    }
    else {
        this.bgSprite.tint = 0x000000;
        
        this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';

        this.hoverLabelBg.alpha = 0;
        this.hoverLabelBgEndcapLeft.alpha = 0;
        this.hoverLabelBgEndcapRight.alpha = 0;
        this.hoverLabel.alpha = 0;

        if (this.data.cost > 0) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.75;
                this.bgSprite.tint = 0x000000;
                this.label.alpha = 0.25;
            }
        }
    }
};

GlassLab.InventoryMenuSlot.prototype._onOver = function() {
    if (!this.parent.dragging_item)
        this.Highlight(true);
};

GlassLab.InventoryMenuSlot.prototype._onOut = function() {
    if (!this.parent.dragging_item)
        this.Highlight(false);
};

// This is the piece that actually gets dragged out
GlassLab.InventoryMenuItem = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIDraggable.prototype.constructor.call(this, game, 0, 0);
    //this.is_dragging = false;

    this.events.onEndDrag.add(this._onEndDrag, this);
    this.events.onInputOver.add(this._onOver, this);
    this.events.onInputOut.add(this._onOut, this);
    this.events.onStartDrag.add(this._onStartDrag, this);

    this.loadTexture( this.data.spriteName );
    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(0.25, 0.25);
};

GlassLab.InventoryMenuItem.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.InventoryMenuItem.prototype.constructor = GlassLab.InventoryMenuItem;

GlassLab.InventoryMenuItem.prototype._onOver = function() {
    if (!this.parent.parent.dragging_item) {
        // for _onOver is called AFTER _onDragEnd. need to compensate for menuslot Highlighting purposes:
        if (this.parent.parent.dropped_item)
            this.parent.parent.dropped_item = false;
        else
            this.parent.Highlight(true);
    }
};

GlassLab.InventoryMenuItem.prototype._onOut = function() {
    if (!this.parent.parent.dragging_item)
        this.parent.Highlight(false);
};

GlassLab.InventoryMenuItem.prototype._onStartDrag = function() {
    this.parent.Highlight(false);
    this.parent.parent.dragging_item = true; // this.parent.parent = InventoryMenu
};

GlassLab.InventoryMenuItem.prototype._onEndDrag = function(target) {
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

    this.parent.parent.dropped_item = true; // this.parent.parent = InventoryMenu
    this.parent.parent.dragging_item = false;
};

GlassLab.InventoryMenuItem.prototype._jumpToStart = function() {
    this.position.setTo(this.dragStartPoint.x, this.dragStartPoint.y); // jump back into the inventory
};