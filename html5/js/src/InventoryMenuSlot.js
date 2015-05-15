/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryMenuSlot = function(game, foodType)
{
    this.foodType = foodType;
    this.data = GlassLab.FoodTypes[this.foodType];
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
    this.bgSpriteColorTween = null;

    // Note that the draggable food item will be available if they're doing an order. Otherwise, the basic food sprite will be visible
    //  and a new world food object will be created when they start to drag.

    // food image, used when not doing an order:
    this.foodSprite = game.make.sprite(0, 0, GlassLab.FoodTypes[this.foodType].spriteName);
    this.foodSprite.anchor.setTo(0.5, 0.5);
    this.foodSprite.scale.setTo(0.75, 0.75);
    this.addChild(this.foodSprite);

    // food STICKER:
    this.draggableItem = new GlassLab.InventoryMenuItem(this.game, this.foodType);
    this.addChild(this.draggableItem);


    // locked slot image (coin):
    this.coinSprite = this.game.make.sprite(0, 0, "inventoryCoin");
    this.coinSprite.anchor.setTo(0.5, 0.75);
    this.coinSprite.alpha = 1;
    this.coinSprite.visible = false;
    this.addChild(this.coinSprite);

    // copy of bgSprite that goes OVER the foodsprite, 0xffffff tint,
    // and it's used only briefly right after the largeCoinAnim sparklepop anim upon food purchase:
    this.largeCoinBgFlash = this.game.make.sprite(0, 0, "foodItemBg");
    this.largeCoinBgFlash.anchor.setTo(0.5, 0.5);
    this.largeCoinBgFlash.tint = 0xffffff;
    this.largeCoinBgFlash.alpha = 0;
    this.largeCoinBgFlash.inputEnabled = false;
    this.addChild(this.largeCoinBgFlash);

    // add foodPurchaseEffects spritesheet and add get_coins anim:
    this.largeCoinAnim = game.make.sprite(0, -26, "foodPurchaseEffects");
    this.largeCoinAnim.animations.add("coin_jump", Phaser.Animation.generateFrameNames("coin_jump_",0,17,".png",3), 24, false);
    this.largeCoinAnim.animations.add("sparkle_pop", Phaser.Animation.generateFrameNames("sparkle_pop_",0,6,".png",3), 24, false);
    this.largeCoinAnim.anchor.setTo(0.5, 0.5);
    this.largeCoinAnim.alpha = 0;
    this.largeCoinAnim.visible = true;
    this.addChild(this.largeCoinAnim);

    // cost:
    this.label = game.make.text(0, this.height / 2, this.cost_display, {fill: '#ffffff', font: "14px EnzoBlack"});
    this.label = GlassLab.Util.SetCenteredText(this.label, this.cost_display, 0.5, 1.0);
    this.addChild(this.label);

    // hoverLabel above slot (show on hover):
    this.hoverLabelContainer = game.make.group();
    this.hoverLabelContainer.y = Math.round((this.height / -2)); // top edge of slot
    this.hoverLabelContainer.alpha = 0;
    this.hoverLabelContainerScaleTween = null;
    this.hoverLabelContainerAlphaTween = null;
    var hoverLabelY = -37; // center of words/labelBg etc is 37 px above top edge of slot

    this.hoverLabel = game.make.text(0, hoverLabelY + 2, this.data.displayNames["singular"], {fill: '#ffffff', font: "16px EnzoBlack"});

    this.hoverLabelBg = this.game.make.image(0, hoverLabelY, "foodLabelBg");
    this.hoverLabelBg._original_width = this.hoverLabelBg.width;
    this.hoverLabelBg.anchor.setTo(.5, .5);
    this.hoverLabelBg.tint = 0x000000;

    this.hoverLabelBgEndcapLeft = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapLeft.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapLeft.tint = 0x000000;

    this.hoverLabelBgEndcapRight = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapRight.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapRight.scale.x *= -1;
    this.hoverLabelBgEndcapRight.tint = 0x000000;

    this.hoverLabelBgPointer = this.game.make.image(0, hoverLabelY + 22, "questObjectiveArrow");
    this.hoverLabelBgPointer.anchor.setTo(.5, .5);
    this.hoverLabelBgPointer.scale.y *= -1;
    this.hoverLabelBgPointer.tint = 0x000000;

    this.hoverLabelCoin = game.make.image(45, hoverLabelY, "inventoryCoinIcon");
    this.hoverLabelCoin.anchor.setTo(.5, .5);
    this.hoverLabelCoin.alpha = 0;

    // add hoverLabel parts as children to container group:
    this.hoverLabelContainer.addChild(this.hoverLabelBg);
    this.hoverLabelContainer.addChild(this.hoverLabelBgEndcapLeft);
    this.hoverLabelContainer.addChild(this.hoverLabelBgEndcapRight);
    this.hoverLabelContainer.addChild(this.hoverLabelBgPointer);
    this.hoverLabelContainer.addChild(this.hoverLabel);
    this.hoverLabelContainer.addChild(this.hoverLabelCoin);

    // add group as child to this:
    this.addChild(this.hoverLabelContainer);

    this.UpdateHoverLabel(); // sets text anchors, hover label bg positions and scale

    // mouse events:
    this.events.onInputDown.add(this._onInputDown, this);
    this.events.onInputUp.add(this._onInputUp, this);
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
        if (this.draggableItem.visible) {
            // the draggable sticker is visible, so start dragging it
            this.parent.dragging_sticker = this.draggableItem;
            this.draggableItem.draggableComponent.tryStartDrag();
        } else {
            // if we're not in shipping mode, spawn a food and start dragging it
            this.parent.dragging_food = new GlassLab.Food(this.game, this.foodType);
            GLOBAL.hoverLayer.add(this.parent.dragging_food);
            this.parent.dragging_food.snapToMouse();
            this.parent.dragging_food.isInitialDropAttempt = true;
            this.parent.dragging_food.draggableComponent.tryStartDrag();
            
            //GLOBAL.UILayer.add(food); // there might be a way to make the food start above the inventory, but it adds complications (like where it should be placed.)

            // TODO GlassLabSDK.saveTelemEvent("place_food", {food_type: this.foodType, column: tile.col, row: tile.row}); // Incorrect name
        }
    } else if (!this.data.unlocked && this.data.cost > 0) {
        this._onPurchaseConfirmed();
    }

    this.Highlight(false); // hide tooltip
};

GlassLab.InventoryMenuSlot.prototype._onInputUp = function(sprite, pointer)
{
    this.Highlight(false);
};

GlassLab.InventoryMenuSlot.prototype._onOver = function()
{
    var show_tooltip = true;

    // check food AND sticker possibilities:
    if (typeof(this.parent.dragging_food) != "undefined" && this.parent.dragging_food != null && this.parent.dragging_food.isHovering)
        show_tooltip = false;
    if (typeof(this.parent.dragging_sticker) != "undefined" && this.parent.dragging_sticker != null)
        show_tooltip = false;

    // show if needed:
    if (show_tooltip) this.Highlight(true);
};

GlassLab.InventoryMenuSlot.prototype._onOut = function()
{
    this.Highlight(false);
};

GlassLab.InventoryMenuSlot.prototype._onPurchaseConfirmed = function()
{
    if (GLOBAL.inventoryManager.TrySpendMoney(this.data.cost)) {
        GLOBAL.inventoryManager.unlock(this.foodType); // if we don't actually call unlock(), the unlock won't be saved

        // do coin jump:
        this.largeCoinAnim.alpha = 1;
        this.coinSprite.alpha = 0;
        var anim = this.largeCoinAnim.play("coin_jump");
        if (anim) {
            anim.onComplete.addOnce(function() {
                // refresh on all MenuSlots, not just this one:
                this.parent.parent.Refresh();

                // this.largeCoinBgFlash, tween opacity:
                this.largeCoinBgFlash.alpha = 1.0;
                var flash_tween = this.game.add.tween(this.largeCoinBgFlash)
                    .to( { alpha: 0 }, 300, Phaser.Easing.Linear.None)
                    .start();

                // sparkle pop:
                var pop_anim = this.largeCoinAnim.play("sparkle_pop");
                if (pop_anim) {
                    pop_anim.onComplete.addOnce(function() {
                        // all done with both anims:
                        this.largeCoinAnim.alpha = 0; // hide anim
                        
                    }, this);
                }
            }, this);
        }
    }
    else {
        // Failed, not enough money: do a red color tween on the bg?
        var bgSprite = this.bgSprite;
        var startColor = 0xc1272d;
        var targetColor = 0x000000;
        var colorTweenCounter = { step: 0 };
        this.bgSpriteColorTween = this.game.add.tween(colorTweenCounter).to( { step: 0.95 }, 2000, Phaser.Easing.Linear.None, true);
        this.bgSpriteColorTween.onUpdateCallback(function() {
            bgSprite.tint = Phaser.Color.interpolateColor(startColor, targetColor, 1, colorTweenCounter.step);
        });
        this.bgSpriteColorTween.onComplete.addOnce(function() {
            bgSprite.tint = 0x000000;
        }, this);
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
    this.hoverLabel = GlassLab.Util.SetCenteredText(this.hoverLabel, null, 0.5, 0.5); // no change in text, just recenter
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
                this.hoverLabel.setText("Need More       "); // spaces important to leave room for hoverLabelCoin
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
    // stop any tweening of the hoverlabel container if there is any:
    if (this.hoverLabelContainerScaleTween != null && this.hoverLabelContainerScaleTween.isRunning)
        this.hoverLabelContainerScaleTween.stop();
    if (this.hoverLabelContainerAlphaTween != null && this.hoverLabelContainerAlphaTween.isRunning)
        this.hoverLabelContainerAlphaTween.stop();

    if (yes_or_no) {
        if (this.bgSpriteColorTween == null || !this.bgSpriteColorTween.isRunning)
            this.bgSprite.tint = 0xffffff;
        this.label.tint = 0x4d4d4d; //this.label.style.fill = '#4d4d4d';
        this.hoverLabelBg.alpha = 0.5;
        this.hoverLabelBgEndcapLeft.alpha = 0.5;
        this.hoverLabelBgEndcapRight.alpha = 0.5;
        this.hoverLabelBgPointer.alpha = 0.5;
        this.hoverLabel.alpha = 1;
        this.hoverLabelCoin.alpha = 0;
        if (this.data.cost > 0 && !this.data.unlocked) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.5;
                if (this.bgSpriteColorTween == null || !this.bgSpriteColorTween.isRunning)
                    this.bgSprite.tint = 0x000000;
                this.label.alpha = 1;
                this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';
                if (!this.data.unlocked)
                    this.hoverLabelCoin.alpha = 1; // reveal coin sprite only if not unlocked
            }
        }

        // set hoverLabelContainer scale and tween alpha and scale to 1.
        this.hoverLabelContainer.scale.y = 0;
        this.hoverLabelContainerScaleTween = this.game.add.tween(this.hoverLabelContainer.scale)
            .to({y: 1}, 200, Phaser.Easing.Elastic.Out, true);
        this.hoverLabelContainerAlphaTween = this.game.add.tween(this.hoverLabelContainer)
            .to({alpha: 1}, 75, Phaser.Easing.Quadratic.Out, true);
    }
    else {
        this.bgSprite.tint = 0x000000;
        this.label.tint = 0xffffff; //this.label.style.fill = '#cccccc';
        //this.hoverLabelBg.alpha = 0;
        //this.hoverLabelBgEndcapLeft.alpha = 0;
        //this.hoverLabelBgEndcapRight.alpha = 0;
        //this.hoverLabelBgPointer.alpha = 0;
        //this.hoverLabel.alpha = 0;
        if (this.data.cost > 0 && !this.data.unlocked) {
            if (this.data.cost > GLOBAL.inventoryManager.money) {
                // can't afford item:
                this.bgSprite.alpha = 0.75;
                this.bgSprite.tint = 0x000000;
                this.label.alpha = 0.25;
                //this.hoverLabelCoin.alpha = 0;
            }
        }

        // tween hoverLabelContainer alpha and scale to 0.
        this.hoverLabelContainerScaleTween = this.game.add.tween(this.hoverLabelContainer.scale)
            .to({y: 0}, 75, Phaser.Easing.Quadratic.Out, true);
        this.hoverLabelContainerAlphaTween = this.game.add.tween(this.hoverLabelContainer)
            .to({alpha: 0}, 75, Phaser.Easing.Quadratic.Out, true);
    }
};



// This was the piece of food that gets dragged out into the world, but we now create the food itself immediately.
// This class is used just for the sticker in Shipping Mode
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
    if (this.parent.parent.dragging_sticker == null && this._at_start_point)
        this.parent.Highlight(true);
};

GlassLab.InventoryMenuItem.prototype._onOut = function()
{
    this.parent.Highlight(false);
};

GlassLab.InventoryMenuItem.prototype._onStartDrag = function()
{
    this.parent.Highlight(false);
};

GlassLab.InventoryMenuItem.prototype._onEndDrag = function(target)
{
    console.log("Stop dragging inventoryMenuItem. Target:",target);
    if (target) { // we dropped it on an acceptable uiDragTarget
        this._jumpToStart(); // move the sprite back
    } // else it will fly back thanks to uiDraggable

    this.parent.parent.dragging_sticker = null;
};

GlassLab.InventoryMenuItem.prototype._jumpToStart = function()
{
    this.position.setTo(this.draggableComponent.dragStartPoint.x, this.draggableComponent.dragStartPoint.y); // jump back into the inventory
};