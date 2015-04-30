/**
 * Created by Rose Abernathy on 4/23/2015.
 */

GlassLab = GlassLab || {};

/**
 * OrderFulfillmentSlot - an entry where the player can set / clear a food type and then enter the number
 */
GlassLab.OrderFulfillmentSlot = function(game, x, y, i, isCreatureSlot) {
    GlassLab.UIButton.prototype.constructor.call(this, game, x, y);
    this.index = i;
    this.enabled = true;

    this.highlight = game.make.sprite(0, -5, "orderHighlight");
    this.addChild(this.highlight);
    this.highlight.alpha = 0;
    // Make sure that our hit area stays as big as the whole highlight area even when the highlight isn't visible
    this.hitArea = new Phaser.Rectangle(this.highlight.x, this.highlight.y, this.highlight.width, this.highlight.height);

    this.answerInput = new GlassLab.UITextInput(game, GlassLab.UITextInput.InputType.NUMERIC, "orderEntryField", {font: "20px ArchitectsDaughter", fill: "#4d4b4a"}, 5);
    this.answerInput.x = 70;
    this.answerInput.SetInputLimit(3);
    this.answerInput.input.priorityID = GLOBAL.UIpriorityID += 5; // high priority
    this.addChild(this.answerInput);
    this.answerInput.events.onInputOver.add(function() { this.overInput = true; }, this);
    this.answerInput.events.onInputOut.add(function() { this.overInput = false; }, this);

    this.label = game.make.text(100, 10, "100", {font: "20px ArchitectsDaughter", fill: "#4d4b4a"});
    this.label.anchor.set(0.5, 0);
    this.addChild(this.label);

    this.sprite = game.make.sprite(30, 20, "apple");
    this.sprite.anchor.setTo(.5, .5);
    if (isCreatureSlot) {
        this.sprite.scale.setTo(0.5, 0.5);
        this.sprite.y -= 3;
    }
    this.addChild(this.sprite);

    if (!isCreatureSlot) { // the first input is for creatures, so we don't have to drag anything onto it
        var dragTarget = new GlassLab.UIDragTarget(game, 160, 50, "orderDragTarget");
        dragTarget.x = 5;
        dragTarget.y = 0;
        dragTarget.objectValidator = function(obj) { return obj.foodType; };
        dragTarget.addObjectAsChild = false;
        dragTarget.events.onObjectDropped.add(this.onFoodDropped, this);
        this.addChild(dragTarget).name = "foodSlot"+i;
        this.dragTarget = dragTarget;

        var clearButton = new GlassLab.UIButton(game, 140, 15, "orderX", this.clearType, this);
        clearButton.input.priorityID ++; // bump it above the slot's ID
        clearButton.whenUp = function() { this.tint = 0x994c4e; };
        clearButton.whenOver = function() { this.tint = 0xd96b6f; };
        clearButton.whenDown = function() { this.tint = 0x592c2d; };
        clearButton.whenUp();
        this.highlight.addChild(clearButton);
        this.clearButton = clearButton;
    }

    this.hoverHighlight = game.make.sprite(0, -5, "orderHighlight");
    this.addChild(this.hoverHighlight);
    this.hoverHighlight.tint = 0xb2b1a9; // this is the beige color that a 25% opacity black makes, so we can go to 100% opacity with it for the same effect
    this.hoverHighlight.alpha = 0;

    this.hoverSprite = game.make.sprite(30, 25, "apple");
    this.hoverSprite.anchor.setTo(.5, .5);
    this.hoverSprite.alpha = 0.5;
    this.hoverHighlight.addChild(this.hoverSprite);

    this.presetValue = 0;
    this.currentType = null;
    this.currentTweens = {}; // dictionary of tweens that may be active

    this.canEnterValue = true;
    this.canSetType = (!isCreatureSlot);

    this.onFoodSet = new Phaser.Signal();

    this.whenUp();

    GlassLab.SignalManager.update.add(this._update, this);
};

GlassLab.OrderFulfillmentSlot.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.OrderFulfillmentSlot.prototype.constructor = GlassLab.OrderFulfillmentSlot;

GlassLab.OrderFulfillmentSlot.prototype._update = function() {
    // we need to check if they're mousing over the clearButton too, since mousing over it will trigger "onOut"
    var isOver = this.over || (this.answerInput && this.answerInput.visible && this.overInput) || (this.clearButton && this.clearButton.visible && this.clearButton.over);

    var wantToHover = isOver && this.enabled && this.canSetType && GLOBAL.dragTarget && GLOBAL.dragTarget.sprite && GLOBAL.dragTarget.sprite.foodType;
    if (wantToHover && !this.hovering) {
        this.hovering = true;
        var spriteName = GlassLab.FoodTypes[GLOBAL.dragTarget.sprite.foodType].spriteName + "_sticker";
        if (this.hoverSprite.key != spriteName) this.hoverSprite.loadTexture(spriteName);
        this.game.add.tween(this.hoverHighlight).to({alpha: 1}, 150, Phaser.Easing.Quadratic.InOut, true);
    } else if (!wantToHover && this.hovering) {
        this.hovering = false;
        this.game.add.tween(this.hoverHighlight).to({alpha: 0}, 150, Phaser.Easing.Quadratic.InOut, true);
    }

    var wantToHighlight = (isOver && this.enabled && this.canEnterValue && !GLOBAL.dragTarget);
    if (wantToHighlight && !this.highlighted) {
        this.highlighted = true;
        this.game.add.tween(this.highlight).to({alpha: 1}, 150, Phaser.Easing.Quadratic.InOut, true);
    } else if (!wantToHighlight && this.highlighted) {
        this.highlighted = false;
        this.game.add.tween(this.highlight).to({alpha: 0}, 150, Phaser.Easing.Quadratic.InOut, true);
    }
};

GlassLab.OrderFulfillmentSlot.prototype.trySetValue = function(value) { // if no value is set, become editable instead
    this.canEnterValue = (typeof value == 'undefined');
    this.presetValue = value;
    this.refresh();
};

// return either the preset value or the value they've entered
GlassLab.OrderFulfillmentSlot.prototype.getValue = function() {
    if (!this.currentType) return false; // they haven't set a type yet
    else if (this.canEnterValue) return parseInt( this.answerInput.GetText());
    else return this.presetValue;
};

GlassLab.OrderFulfillmentSlot.prototype.reset = function() {
    this.answerInput.SetText("");
    this.currentType = null;
};

GlassLab.OrderFulfillmentSlot.prototype.setEnabled = function(enabled) {
    this.enabled = enabled;
    this.answerInput.setEnabled(enabled);
    if (this.dragTarget) this.dragTarget.setEnabled(enabled);
    if (this.clearButton) this.clearButton.visible = enabled && this.currentType;
};

GlassLab.OrderFulfillmentSlot.prototype.refresh = function(hide) {
    // if we were ordered to hide, hide ourselves
    if (hide) {
        this.visible = false;
        this.setEnabled(false);
        return;
    } else {
        this.visible = true;
        this.setEnabled(true);
    }

    // check if we should show the drag target
    if (this.canEnterValue && this.canSetType && !this.currentType) { // we want to show a drag target or nothing
        this.label.visible = this.sprite.visible = this.answerInput.visible = this.clearButton.visible = false;
        this.dragTarget.visible = true;
        return;
    }

    // else the drag target isn't visible
    if (this.dragTarget) this.dragTarget.visible = false;
    if (this.clearButton) this.clearButton.visible = this.currentType;

    // otherwise show the sprite
    this.sprite.visible = true;
    var spriteName;
    if (this.currentType in GlassLab.FoodTypes) {
        spriteName = GlassLab.FoodTypes[this.currentType].spriteName + "_sticker";
    } else {
        spriteName = GLOBAL.creatureManager.GetCreatureData(this.currentType).spriteName + "_sticker";
    }
    if (this.sprite.spriteName != spriteName) this.sprite.loadTexture( spriteName );

    // and show either an entry field or a label, depending on whether the player can enter their own value
    this.answerInput.visible = this.canEnterValue;
    if (this.answerInput.visible) this.answerInput.setEnabled(true);

    this.label.visible = !this.canEnterValue;
    this.label.text = this.presetValue || ""; // if we have no value, the label will be invisible anyway, so w/e

    return false; // no, we aren't showing a drag target
};

GlassLab.OrderFulfillmentSlot.prototype.onFoodDropped = function(dragObject, dragTarget) {
    if (dragObject.foodType && dragObject.foodType != this.currentType) {
        this.currentType = dragObject.foodType;
        this.onFoodSet.dispatch(this.index, this.currentType);

        this.answerInput.SetFocus(true);
        this.refresh();
    }
};

GlassLab.OrderFulfillmentSlot.prototype.clearType = function() {
    console.log("Clear foodtype");
    this.currentType = null;
    this.answerInput.SetText(""); // clear the entered value as well
    this.onFoodSet.dispatch(this.index, this.currentType);
    this.refresh();
};
