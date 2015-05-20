/**
 * Created by Rose Abernathy on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Assistant = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.portrait = game.make.sprite(0,0, "assistantAnim");
    this.portrait.animations.add("in", Phaser.Animation.generateFrameNames("assistant_in_",0,14,".png",3), 24, false);
    this.portrait.animations.add("out", Phaser.Animation.generateFrameNames("assistant_out_",0,10,".png",3), 24, false);
    this.portrait.anchor.set(1, 1);
    this.sprite.addChild(this.portrait);

    this.dialogue = game.make.sprite(0, 0);
    this.sprite.addChild(this.dialogue);

    this.speechBubble = game.make.sprite(-160,-80, "speech_bubble");
    this.speechBubble.tint = 0x000000;
    this.speechBubble.alpha = 0.75;
    this.speechBubble.anchor.set(1, 0.5);
    this.dialogue.addChild(this.speechBubble);

    var style = { font: "16px Arial", fill: GlassLab.Assistant.TEXT_COLOR, align: "left", wordWrap: true, wordWrapWidth: 320 };
    this.label = game.make.text(-515, -125, "Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet",style);
    this.label.align = "left";
    this.label.anchor.set(0, 0);
    this.dialogue.addChild(this.label);

    this.cancelButton = new GlassLab.HUDButton(this.game, -440, -50, null, "speech_button", "Nope...", {font: "14pt EnzoBlack", fill: "#ffffff"}, true, this._onCancelPressed, this);
    this.cancelButton.addOutline("speech_button_border");
    this.continueButton = new GlassLab.HUDButton(this.game, -270, -50, null, "speech_button", "Yes!", {font: "14pt EnzoBlack", fill: "#ffffff"}, true, this._onContinuePressed, this);
    this.continueButton.addOutline("speech_button_border");
    this.modalButton = new GlassLab.HUDButton(this.game, -270, -50, null, "speech_button", "OK", {font: "14pt EnzoBlack", fill: "#ffffff"}, true, this._onModalPressed, this);
    this.modalButton.addOutline("speech_button_border");
    this.advanceTutorialButton = new GlassLab.HUDButton(this.game, -270, -50, null, "speech_button", "OK", {font: "14pt EnzoBlack", fill: "#ffffff"}, true, this._onAdvanceTutorialPressed, this);
    this.advanceTutorialButton.addOutline("speech_button_border");
    this.advanceTutorialButton.visible = false;

    this.dialogue.addChild(this.cancelButton);
    this.dialogue.addChild(this.continueButton);
    this.dialogue.addChild(this.modalButton);
    this.modalButton.visible = false;
    this.dialogue.addChild(this.advanceTutorialButton);

    this.buttons = [this.cancelButton, this.continueButton, this.modalButton, this.advanceTutorialButton];

    this.dialogue.inputEnabled = true;
    this.dialogue.events.onInputUp.add(this.toggleMinimized, this);
    this.dialogue.input.customHoverCursor = "button";

    this.miniDialogue = game.make.sprite(0, 0);
    this.sprite.addChild(this.miniDialogue);
    this.miniDialogue.visible = false;

    this.miniSpeechBubble = game.make.sprite(-160, -80, "speech_bubble_small");
    this.miniSpeechBubble.tint = 0x000000;
    this.miniSpeechBubble.alpha = 0.75;
    this.miniSpeechBubble.anchor.set(1, 0.5);
    this.miniDialogue.addChild(this.miniSpeechBubble);

    this.dots = game.make.sprite(-187,-80, "assistantAnim");
    this.dots.animations.add("anim", Phaser.Animation.generateFrameNames("assistant_speech_min_dot_dance_",0,25,".png",3), 24, true);
    this.dots.play("anim");
    this.dots.anchor.setTo(0.5, 0.5);
    this.miniDialogue.addChild(this.dots);

    this.miniDialogue.inputEnabled = true;
    this.miniDialogue.events.onInputUp.add(this.toggleMinimized, this);
    this.miniDialogue.input.customHoverCursor = "button";

    this.numberOfReloads = 0;
    this.maxReloads = 3;

    this.sprite.visible = false;
    this.visibilityState = "closed"; // "open", "opening", "closed", "closing"
    this.minimized = false;
    this.inTutorial = false;
    this.order = null;

    this.dialogueTween;

    this.currentText = "";

    GlassLab.SignalManager.inventoryOpened.add(this._onInventoryOpened, this);
    GlassLab.SignalManager.inventoryClosed.add(this._onInventoryClosed, this);
};

GlassLab.Assistant.STATES = {
    ORDER_INTRO: "ORDER_INTRO",
    ORDER_FOOD_CHOSEN: "ORDER_FOOD_CHOSEN",
    ORDER_CRATE_LOADED: "ORDER_CRATE_LOADED",
    ORDER_CRATE_READY: "ORDER_CRATE_READY",
    ORDER_CRATE_SHIPPING: "ORDER_CRATE_SHIPPING"
};

GlassLab.Assistant.TEXT_COLOR = "#ffffff"; // base color, used to stop highlights
GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR = "#FFB300"; // used to color parts of the text

// For tutorial popup
GlassLab.Assistant.prototype.showTutorial = function(text, showButton) {
    this._tryOpen();
    this.showButtons(false);
    this.advanceTutorialButton.visible = showButton;
    this._setText(text);

    this.modalButton.visible = false;

    this.inTutorial = true;
    this._refreshMinimizeable();
};

GlassLab.Assistant.prototype.hideTutorial = function() {
    this.advanceTutorialButton.visible = false;
    this.inTutorial = false;
    this._tryClose();
};

GlassLab.Assistant.prototype._tryClose = function() {
    if (!this.inTutorial && !this.order && this.visibilityState != "close" && this.visibilityState != "closing") {
        this._startClosing();
    }
};

GlassLab.Assistant.prototype._tryOpen = function() {
    this.setMinimized(false);
    if (this.visibilityState != "open" && this.visibilityState != "opening") {
        this._startOpening();
    }
};

GlassLab.Assistant.prototype.showModal = function(text, buttonCallback)
{
    if (this.inTutorial)
    {
        this.afterModalText = this.currentText;
    }
    this._tryOpen();
    this.showButtons(false);
    this._setText(text);
    this._modalCallback = buttonCallback;
    this.modalButton.visible = true;
};

GlassLab.Assistant.prototype._startOpening = function() {
    GLOBAL.audioManager.playSound("buttonClickSound");
    this.sprite.visible = true;
    this.visibilityState = "opening";
    var anim = this.portrait.play("in");
    if (anim) anim.onComplete.addOnce(this._open, this);
    else this._open();
    this.dialogue.alpha = 0;
    this.game.add.tween(this.dialogue).to( { alpha: 1 }, 100, Phaser.Easing.Quadratic.InOut, true);
    this._refreshMinimizeable();
};

GlassLab.Assistant.prototype._open = function() {
    this.sprite.visible = true;
    this.visibilityState = "open";
    var anim = this.portrait.play("in");
    anim.paused = true;
    anim.frame = 14;
    this.dialogue.alpha = 1;
    this._refreshMinimizeable();
};

GlassLab.Assistant.prototype._startClosing = function() {
    this.sprite.visible = true;
    this.visibilityState = "closing";
    var anim = this.portrait.play("out");
    if (anim) anim.onComplete.addOnce(this._close, this);
    else this._close;
    this.game.add.tween(this.dialogue).to( { alpha: 0 }, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.Assistant.prototype._close = function() {
    this.sprite.visible = false;
    this.visibilityState = "closed";
    if (this.readyTimer) this.game.time.events.remove(this.readyTimer); // clean up the timer if necessary
};

GlassLab.Assistant.prototype.forceClose = function() {
    this.inTutorial = this.order = false;
    this._close();
};

GlassLab.Assistant.prototype._refreshMinimizeable = function() {
    var canMinimize = (this.visibilityState == "open");
    if (canMinimize && !this.minimized) {
        for (var i = 0; i < this.buttons.length; i++) {
            if (this.buttons[i] && this.buttons[i].visible) canMinimize = false;
        }
    }

    this.dialogue.inputEnabled = canMinimize;
    this.miniDialogue.inputEnabled = canMinimize;

    return canMinimize;
};

GlassLab.Assistant.prototype.toggleMinimized = function() {
    if (!this._refreshMinimizeable()) return;

    this.setMinimized(!this.minimized);
};


GlassLab.Assistant.prototype.setMinimized = function(minimized) {
    this.minimized = minimized;

    this.dialogue.visible = !this.minimized;
    this.miniDialogue.visible = this.minimized;
};

// For use when completing an order
GlassLab.Assistant.prototype.startOrder = function(order) {
    this._tryOpen();
    this.numberOfReloads = 0;
    this._enterStateOrderIntro(order);
    this.order = order;
};

GlassLab.Assistant.prototype.endOrder = function(order) {
    this.order = null;
    if (this.readyTimer) this.game.time.events.remove(this.readyTimer); // clean up the timer if necessary
    this._tryClose();
};

GlassLab.Assistant.prototype.onPenLoaded = function() {
    var lastChance = this.numberOfReloads >= this.maxReloads;
    if (lastChance) {
        this._enterStateOrderCrateReady();
    } else {
        this._enterStateOrderCrateLoaded();
    }
};

GlassLab.Assistant.prototype._enterStateOrderIntro = function(order) {
    this.state = GlassLab.Assistant.STATES.ORDER_INTRO;
    this.showButtons(false);
    var orderSegment;
    var numFood = (order.numFoodA || order.numFoodB);

    if ((order.totalNumFood && !order.noFoodEntries) || (order.numCreatures && numFood)) { // both food and creatures
        orderSegment = "*enough " + GLOBAL.creatureManager.GetCreatureName(order.creatureType, true) + " and the correct amount of food.* What";
    } else if (!order.numCreatures) { // creatures are asked for
        orderSegment = "*enough " + GLOBAL.creatureManager.GetCreatureName(order.creatureType, true) + " to eat this food.* How many";
    } else { // only food
        orderSegment = "*enough food to feed "+order.numCreatures+" "+GLOBAL.creatureManager.GetCreatureName(order.creatureType, (order.numCreatures > 1)) + ".* What";
    }

    this._setText("I see, an order from "+order.client+" for "+orderSegment+" should I load into the crate?");
};

GlassLab.Assistant.prototype._enterStateOrderFoodChosen = function(foodTypes, lastChance) {
    GLOBAL.orderFulfillment.submitButton.setEnabled(true);
    this.state = GlassLab.Assistant.STATES.ORDER_FOOD_CHOSEN;
    this.showButtons(false);

    if (!foodTypes) {
        this._setText((lastChance? "I'll load this *one more time.* " : "") + "What should I load into the crate?");
        return;
    }

    // Format the list of food types into "a", "a and b", or "a, b, and c"
    foodTypes = [].concat(foodTypes); // make it an array if it wasn't one
    var food = foodTypes[0] + "s";
    if (foodTypes.length > 2) {
        food += ",";
        for (var i = 1; i < foodTypes.length - 1; i++) {
            food += " " + GlassLab.Food.getName(foodTypes[i], true);
        }
    }
    if (foodTypes.length > 1) {
        food += " and " + GlassLab.Food.getName(foodTypes[foodTypes.length-1], true);
    }

    var text = "*How many* "+ food + " shall I load into the crate?";
    if (lastChance) {
        text = "I'll load this one more time. "+text;
    } else {
        var upperFood = food.substr(0, 1).toUpperCase() + food.substr(1);
        text = upperFood + ", very good. " + text;
    }
    this._setText(text);
};

GlassLab.Assistant.prototype._enterStateOrderCrateLoaded = function() {
    this.state = GlassLab.Assistant.STATES.ORDER_CRATE_LOADED;
    this.showButtons(true);
    var text = "Is this what you wanted?";
    if (this.numberOfReloads) text = "I've reloaded the crate. Is this correct?";
    this._setText(text);
};

GlassLab.Assistant.prototype._enterStateOrderCrateReady = function() {
    this.state = GlassLab.Assistant.STATES.ORDER_CRATE_READY;
    this.showButtons(false);
    this._setText("Ok, that's enough! I'm going to ship the crate off now.");
    this.readyTimer = this.game.time.events.add(3000, this._enterStateOrderCrateShipping, this);
};

GlassLab.Assistant.prototype._enterStateOrderCrateShipping = function() {
    this.state = GlassLab.Assistant.STATES.ORDER_CRATE_SHIPPING;

    GLOBAL.orderFulfillment.shipCrate();

    this.endOrder();
};

GlassLab.Assistant.prototype._setText = function(text) {
    this.currentText = text;
    GlassLab.Util.SetColoredText(this.label, text, GlassLab.Assistant.TEXT_COLOR, GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR);
    this.setMinimized(false);
    this._refreshMinimizeable();
};

GlassLab.Assistant.prototype._onCancelPressed = function() {
    if (this.state == GlassLab.Assistant.STATES.ORDER_CRATE_LOADED) {
        this.numberOfReloads ++;
        GLOBAL.orderFulfillment.restartLoading(this.numberOfReloads);
        var lastChance = (this.numberOfReloads >= this.maxReloads);
        this._enterStateOrderFoodChosen(null, lastChance);
    }
};

GlassLab.Assistant.prototype._onContinuePressed = function() {
    if (this.state == GlassLab.Assistant.STATES.ORDER_CRATE_LOADED) {
        this._enterStateOrderCrateShipping();
    }
};

GlassLab.Assistant.prototype._onAdvanceTutorialPressed = function() {
    console.log("Next");
    GlassLab.SignalManager.tutorialAdvanced.dispatch();
};

GlassLab.Assistant.prototype.showButtons = function(show) {
    this.cancelButton.visible = show;
    this.continueButton.visible = show;
};

GlassLab.Assistant.prototype._onModalPressed = function()
{
    if (this.afterModalText)
    {
        this._setText(this.afterModalText);
        delete this.afterModalText;
    }

    if (this._modalCallback)
    {
        this._modalCallback();
    }

    this.modalButton.visible = false;

    this._tryClose();
};

GlassLab.Assistant.prototype._onInventoryOpened = function() {
    this.sprite.y = -110;
};

GlassLab.Assistant.prototype._onInventoryClosed = function() {
    this.sprite.y = 0;
};