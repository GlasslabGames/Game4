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

    // set hitArea to just the bg texture rect, so other children, like hoverlabel, dont get checked for input events:
    this.hitArea = new Phaser.Rectangle(0 - this.texture.width/2, 0 - this.texture.height/2, this.texture.width, this.texture.height);

    // bg sprite:
    this.bgSprite = this.game.make.sprite(0, 0, "foodItemBg");
    this.bgSprite.anchor.setTo(0.5, 0.5);
    this.bgSprite.tint = 0x000000;
    this.bgSprite.alpha = 0.5;
    this.addChild(this.bgSprite);

    // slot image:
    this.foodSprite = game.make.sprite(0, 0, GlassLab.FoodTypes[this.foodType].spriteName); //new GlassLab.InventoryMenuItem(this.game, this.foodType);
    this.foodSprite.anchor.setTo(0.5, 0.5);
    this.foodSprite.scale.setTo(0.75, 0.75);
    this.addChild(this.foodSprite);

    // draggable food item:
    this.draggableItem = new GlassLab.InventoryMenuItem(this.game, this.foodType);
    this.addChild(this.draggableItem);

    // Note that the draggable food item will be available if they're doing an order. Otherwise, the basic food sprite will be visible
    //  and a new world food object will be created when they start to drag.

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
    var hoverLabelY = Math.round((this.height / -2)) - 37; // 37px above top edge of slot

    this.hoverLabel = game.make.text(0, hoverLabelY + 2, this.data.displayNames["singular"], {fill: '#ffffff', font: "16px EnzoBlack"});
    this.hoverLabel.alpha = 0;

    this.hoverLabelBg = this.game.make.image(0, hoverLabelY, "foodLabelBg");
    this.hoverLabelBg._original_width = this.hoverLabelBg.width;
    this.hoverLabelBg.anchor.setTo(.5, .5);
    this.hoverLabelBg.alpha = 0;
    this.hoverLabelBg.tint = 0x000000;

    this.hoverLabelBgEndcapLeft = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapLeft.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapLeft.alpha = 0;
    this.hoverLabelBgEndcapLeft.tint = 0x000000;

    this.hoverLabelBgEndcapRight = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapRight.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapRight.alpha = 0;
    this.hoverLabelBgEndcapRight.scale.x *= -1;
    this.hoverLabelBgEndcapRight.tint = 0x000000;

    this.hoverLabelBgPointer = this.game.make.image(0, hoverLabelY + 22, "questObjectiveArrow");
    this.hoverLabelBgPointer.anchor.setTo(.5, .5);
    this.hoverLabelBgPointer.alpha = 0;
    this.hoverLabelBgPointer.scale.y *= -1;
    this.hoverLabelBgPointer.tint = 0x000000;

    this.hoverLabelCoin = game.make.image(45, hoverLabelY, "inventoryCoinIcon");
    this.hoverLabelCoin.anchor.setTo(.5, .5);
    this.hoverLabelCoin.alpha = 0;

    // add hoverLabel parts as children:
    this.addChild(this.hoverLabelBg);
    this.addChild(this.hoverLabelBgEndcapLeft);
    this.addChild(this.hoverLabelBgEndcapRight);
    this.addChild(this.hoverLabelBgPointer);
    this.addChild(this.hoverLabel);
    this.addChild(this.hoverLabelCoin);

    this.UpdateHoverLabel(); // sets text anchors, hover label bg positions and scale


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
    if (this.data.unlocked) {
        if (this.draggableItem.visible) { // the draggable sticker if visible, so start dragging it
            this.draggableItem.draggableComponent.tryStartDrag();
        } else { // if we're not in shipping mode, spawn a food and start dragging it
            var food = new GlassLab.Food(this.game, this.foodType);
            GLOBAL.hoverLayer.add(food);
            food.snapToMouse();
            food.isInitialDropAttempt = true;
            food.draggableComponent.tryStartDrag();
            //GLOBAL.UILayer.add(food); // there might be a way to make the food start above the inventory, but it adds complications (like where it should be placed.)

            // TODO GlassLabSDK.saveTelemEvent("place_food", {food_type: this.foodType, column: tile.col, row: tile.row}); // Incorrect name
        }
    } else if (!this.data.unlocked && this.data.cost > 0) {
        this._onPurchaseConfirmed();
    }
};

GlassLab.InventoryMenuSlot.prototype._onPurchaseConfirmed = function()
{
    if (GLOBAL.inventoryManager.TrySpendMoney(this.data.cost)) {
        GLOBAL.inventoryManager.unlock(this.foodType); // if we don't actually call unlock(), the unlock won't be saved
        this.Refresh();
    }
    else {
        // Failed, not enough money
    }
};

GlassLab.InventoryMenuSlot.prototype.UpdateHoverLabel = function()
{
    // init all x coords to original values to make sure the scooting calculations aren't compounded:
    this.hoverLabel.x = 0;
    this.hoverLabelBg.x = 0;
    this.hoverLabelBgEndcapLeft.x = 0;
    this.hoverLabelBgEndcapRight.x = 0;
    this.hoverLabelCoin.x = 45;

    // calculates sizes, scales, text anchors, etc of various components of the hoverLabel:
    this.hoverLabel.anchor.x = Math.round(this.hoverLabel.width * 0.5) / this.hoverLabel.width; // round to avoid subpixel blur
    this.hoverLabel.anchor.y = Math.round(this.hoverLabel.height * 0.5) / this.hoverLabel.height; // round to avoid subpixel blur
    this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
    this.hoverLabelBgEndcapLeft.x = 0 - (this.hoverLabel.width/2 + 15);
    this.hoverLabelBgEndcapRight.x = this.hoverLabel.width/2 + 15;

    // scoot inward if the label extends too far past either end of this.parent.parent.foodBarBg:
    if (this.parent != null && this.parent.getChildIndex(this) != null) {
        var my_slot_i = this.parent.getChildIndex(this);
        var left_edge_offset = Math.round((this.parent.managedChildren[my_slot_i].x + this.texture.width/2) + this.hoverLabelBgEndcapLeft.x);
        var right_edge_offset = (this.parent.managedChildren[my_slot_i].x + this.texture.width/2) + this.hoverLabelBgEndcapRight.x;
        right_edge_offset = Math.round(right_edge_offset - this.parent.parent.foodBarBgEndcapRight.x);
        
        // hacky hardcoded nudging - TODO: base this on UITable's padding values and InventoryMenu's foodBarBg.x:
        left_edge_offset -= 2;
        right_edge_offset -= 3;

        if (left_edge_offset < 0) {
            this.hoverLabel.x -= left_edge_offset;
            this.hoverLabelBg.x -= left_edge_offset;
            this.hoverLabelBgEndcapLeft.x -= left_edge_offset;
            this.hoverLabelBgEndcapRight.x -= left_edge_offset;
            this.hoverLabelCoin.x -= left_edge_offset;
        }
        else if (right_edge_offset > 0) {
            this.hoverLabel.x -= right_edge_offset;
            this.hoverLabelBg.x -= right_edge_offset;
            this.hoverLabelBgEndcapLeft.x -= right_edge_offset;
            this.hoverLabelBgEndcapRight.x -= right_edge_offset;
            this.hoverLabelCoin.x -= right_edge_offset;
        }
    }
};

GlassLab.InventoryMenuSlot.prototype.Refresh = function()
{
    this.inputEnabled = true; // true for almost all cases, but it will be turned off if the food is not unlocked and not available

    if (this.data.unlocked) {
        this.bgSprite.alpha = 0.5;
        // If we're currently filling an order, use the draggableItem (which can be dragged to the order form.)
        // Else, use the basic food sprite (and the player can drag a food object into the world.)
        this.foodSprite.visible = !GLOBAL.mailManager.currentOrder;
        this.draggableItem.visible = GLOBAL.mailManager.currentOrder;
        this.coinSprite.visible = false;
        this.label.visible = false;

        // hover label adjustments:
        this.hoverLabel.setText(this.data.displayNames["singular"]);
        this.UpdateHoverLabel();

        this.input.customHoverCursor = "grab_open";
    }
    else {
        if (this.data.cost > 0 && this.data.available) {
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
                this.hoverLabel.setText("Need More       "); // spaces important
                this.UpdateHoverLabel();

                this.input.customHoverCursor = null;
            }
            else {
                // can afford!
                this.hoverLabel.setText("Unlock " + this.data.displayNames["singular"]);
                this.UpdateHoverLabel();

                this.input.customHoverCursor = "button";
            }
        }
        else {
            this.label.visible = false;
            this.coinSprite.visible = false;
            this.inputEnabled = false;
            // this.visible = false; // This option hides the whole button (and other buttons will move left to fill in the gap)
        }
        this.foodSprite.visible = false;
        this.draggableItem.visible = false;
    }

    this._signalChange();
};

GlassLab.InventoryMenuSlot.prototype.Highlight = function(yes_or_no)
{
    if (yes_or_no) {
        this.bgSprite.tint = 0xffffff;
        this.label.tint = 0x4d4d4d; //this.label.style.fill = '#4d4d4d';
        this.hoverLabelBg.alpha = 0.5;
        this.hoverLabelBgEndcapLeft.alpha = 0.5;
        this.hoverLabelBgEndcapRight.alpha = 0.5;
        this.hoverLabelBgPointer.alpha = 0.5;
        this.hoverLabel.alpha = 1;
        if (this.data.cost > 0) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.5;
                this.bgSprite.tint = 0x000000;
                this.label.alpha = 1;
                this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';
                this.hoverLabelCoin.alpha = 1;
            }
        }
    }
    else {
        this.bgSprite.tint = 0x000000;
        this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';
        this.hoverLabelBg.alpha = 0;
        this.hoverLabelBgEndcapLeft.alpha = 0;
        this.hoverLabelBgEndcapRight.alpha = 0;
        this.hoverLabelBgPointer.alpha = 0;
        this.hoverLabel.alpha = 0;
        if (this.data.cost > 0) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.75;
                this.bgSprite.tint = 0x000000;
                this.label.alpha = 0.25;
                this.hoverLabelCoin.alpha = 0;
            }
        }
    }
};

GlassLab.InventoryMenuSlot.prototype._onOver = function()
{
    if (!this.parent.dragging_item)
        this.Highlight(true);
};

GlassLab.InventoryMenuSlot.prototype._onOut = function()
{
    if (!this.parent.dragging_item)
        this.Highlight(false);
};



// This was the piece of food that gets dragged out into the world, but we now create the food itself immediately.
// So this class currently isn't used, but leaving it here for reference (e.g. the UI functionality)
GlassLab.InventoryMenuItem = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[foodType];
    GlassLab.UIDraggable.prototype.constructor.call(this, game, 0, 0);
    this.draggableComponent.snap = true;

    var hitArea = new Phaser.Rectangle(-40, -45, 80, 90);
    this.hitArea = hitArea;
    //this.addChild(this.game.make.graphics().beginFill("0xffffff", 0.5).drawRect(hitArea.x, hitArea.y, hitArea.width, hitArea.height));

    this.events.onEndDrag.add(this._onEndDrag, this);
    this.events.onInputOver.add(this._onOver, this);
    this.events.onInputOut.add(this._onOut, this);
    this.events.onStartDrag.add(this._onStartDrag, this);

    this.loadTexture( this.data.spriteName+"_sticker" );
    this.anchor.setTo(0.5, 0.5);
};

GlassLab.InventoryMenuItem.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.InventoryMenuItem.prototype.constructor = GlassLab.InventoryMenuItem;

GlassLab.InventoryMenuItem.prototype._onOver = function()
{
    if (!this.parent.parent.dragging_item) {
        // for _onOver is called AFTER _onDragEnd. need to compensate for menuslot Highlighting purposes:
        if (this.parent.parent.dropped_item)
            this.parent.parent.dropped_item = false;
        else
            this.parent.Highlight(true);
    }
};

GlassLab.InventoryMenuItem.prototype._onOut = function()
{
    if (!this.parent.parent.dragging_item)
        this.parent.Highlight(false);
};

GlassLab.InventoryMenuItem.prototype._onStartDrag = function()
{
    this.parent.Highlight(false);
    this.parent.parent.dragging_item = true; // this.parent.parent = InventoryMenu
};

GlassLab.InventoryMenuItem.prototype._onEndDrag = function(target)
{
    console.log("Stop dragging inventoryMenuItem. Target:",target);
    if (target) { // we dropped it on an acceptable uiDragTarget
        this._jumpToStart(); // move the sprite back
    } // else it will fly back thanks to uiDraggable

    this.parent.parent.dropped_item = true; // this.parent.parent = InventoryMenu
    this.parent.parent.dragging_item = false;
};

GlassLab.InventoryMenuItem.prototype._jumpToStart = function()
{
    this.position.setTo(this.draggableComponent.dragStartPoint.x, this.draggableComponent.dragStartPoint.y); // jump back into the inventory
};