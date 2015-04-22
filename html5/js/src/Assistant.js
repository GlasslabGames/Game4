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

    this.cancelButton = new GlassLab.UIRectButton(this.game, -535, -40, this._onCancelPressed, this, 175, 40, 0xffffff, "Nope, reload it", 18);
    this.continueButton = new GlassLab.UIRectButton(this.game, -345, -40, this._onContinuePressed, this, 175, 40, 0xffffff, "Yes!", 18);
    this.advanceTutorialButton = new GlassLab.UIRectButton(this.game, -200, 10, this._onAdvanceTutorialPressed, this, 75, 40, 0xffffff, "OK", 18);
    this.advanceTutorialButton.visible = false;
    this.dialogue.addChild(this.cancelButton);
    this.dialogue.addChild(this.continueButton);
    this.dialogue.addChild(this.advanceTutorialButton);

    this.numberOfReloads = 0;
    this.maxReloads = 3;

    this.sprite.visible = false;
    this.visibilityState = "closed"; // "open", "opening", "closed", "closing"
    this.inTutorial = false;
    this.order = null;

    GlassLab.SignalManager.inventoryOpened.add(this._onInventoryOpened, this);
    GlassLab.SignalManager.inventoryClosed.add(this._onInventoryClosed, this);
};

GlassLab.Assistant.STATES = {ORDER_INTRO: "ORDER_INTRO", ORDER_FOOD_CHOSEN: "ORDER_FOOD_CHOSEN", ORDER_CRATE_LOADED: "ORDER_CRATE_LOADED", ORDER_CRATE_READY: "ORDER_CRATE_READY"};

GlassLab.Assistant.TEXT_COLOR = "#ffffff"; // base color, used to stop highlights
GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR = "#FFB300"; // used to color parts of the text

// For tutorial popup
GlassLab.Assistant.prototype.showTutorial = function(text, showButton) {
    this._tryOpen();
    this.showButtons(false);
    this.advanceTutorialButton.visible = showButton;
    this._setText(text);

    this.inTutorial = true;
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
    if (this.visibilityState != "open" && this.visibilityState != "opening") {
        this._startOpening();
    }
};

GlassLab.Assistant.prototype._startOpening = function() {
    this.sprite.visible = true;
    this.visibilityState == "opening";
    var anim = this.portrait.play("in");
    if (anim) anim.onComplete.addOnce(this._startOpen, this);
    else this._startOpen();
    this.dialogue.alpha = 0;
    this.game.add.tween(this.dialogue).to( { alpha: 1 }, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.Assistant.prototype._startOpen = function() {
    this.sprite.visible = true;
    this.visibilityState == "open";
    var anim = this.portrait.play("in");
    anim.paused = true;
    anim.frame = 14;
    this.dialogue.alpha = 1;
};

GlassLab.Assistant.prototype._startClosing = function() {
    this.sprite.visible = true;
    this.visibilityState == "closing";
    var anim = this.portrait.play("out");
    if (anim) anim.onComplete.addOnce(this._startClosed, this);
    else this._startClosed();
    this.game.add.tween(this.dialogue).to( { alpha: 0 }, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.Assistant.prototype._startClosed = function() {
    this.sprite.visible = false;
    this.visibilityState == "closed";
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
    this._tryClose();
};

GlassLab.Assistant.prototype.onPenLoaded = function() {
    var lastChance = this.numberOfReloads >= this.maxReloads;
    if (lastChance) {
        this._enterStateOrderCrateReady(true);
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
    } else if ((order.totalNumFood && order.noFoodEntries) || order.numCreatures) { // only creatures are asked for
        orderSegment = "*enough " + GLOBAL.creatureManager.GetCreatureName(order.creatureType, true) + " to eat this food.* How many";
    } else { // only food
        orderSegment = "*enough food to feed "+order.numCreatures+" "+GLOBAL.creatureManager.GetCreatureName(order.creatureType, (order.numCreatures > 1)) + ".* What";
    }

    this._setText("I see, an order from "+order.client+" for "+orderSegment+" should I load into the crate?");
};

GlassLab.Assistant.prototype._enterStateOrderFoodChosen = function(foodTypes, lastChance) {
    this.state = GlassLab.Assistant.STATES.ORDER_FOOD_CHOSEN;
    this.showButtons(false);

    if (!foodTypes) {
        this._setText((lastChance? "I'll load this one more time. " : "") + "What should I load into the crate?");
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

GlassLab.Assistant.prototype._enterStateOrderCrateReady = function(lastChance) {
    this.state = GlassLab.Assistant.STATES.ORDER_CRATE_READY;
    this.showButtons(false);
    GLOBAL.orderFulfillment.submitButton.setEnabled(true);
    if (lastChance) {
        this._setText("That's enough reloading. Just *click the 'Ship Crate!' button* to the left to ship it off.");
    } else {
        this._setText("Excellent! Just *click the 'Ship Crate!' button* to the left, and I'll ship this crate forthwith.");
    }
};

GlassLab.Assistant.prototype._setText = function(text) {
    GlassLab.Util.SetColoredText(this.label, text, GlassLab.Assistant.TEXT_COLOR, GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR);
};

GlassLab.Assistant.prototype._onCancelPressed = function() {
    if (this.state == GlassLab.Assistant.STATES.ORDER_CRATE_LOADED) {
        this.numberOfReloads ++;
        GLOBAL.orderFulfillment.restartLoading(this.numberOfReloads);
        var lastChance = (this.numberOfReloads >= this.maxReloads);
        this._enterStateOrderFoodChosen(null, lastChance); // TODO - set food
    }
};

GlassLab.Assistant.prototype._onContinuePressed = function() {
    if (this.state == GlassLab.Assistant.STATES.ORDER_CRATE_LOADED) {
        this._enterStateOrderCrateReady();
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

GlassLab.Assistant.prototype._onInventoryOpened = function() {
    this.sprite.y = -110;
};

GlassLab.Assistant.prototype._onInventoryClosed = function() {
    this.sprite.y = 0;
};

/*
 1. Start: Here's the order, how should I load the crate?
 2. Add food: Carrots, I see. How many? // Carrots and potatoes, very good. How many?
 3. Load crate: Is this what you wanted? Nope // Yes
 4. Nope: Ok, how many then??
 5. Load crate: I've reloaded. Correct?
 6. Nope again: Ok, I'll load it one more time.
 7. Load crate: I hope this is what you wanted. Click Ship Crate.
 6. Yes: Ok, click the Ship Crate button

    Plus intro stuff.
  */