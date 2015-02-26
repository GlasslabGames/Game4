/**
 * Created by Rose Abernathy on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Assistant = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.portrait = game.make.sprite(0,0, "assistant");
    this.portrait.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.portrait);

    this.speechBubble = game.make.sprite(-80,0, "speech_bubble");
    this.speechBubble.anchor.set(1, 0.5);
    this.sprite.addChild(this.speechBubble);

    var style = { font: "18px Arial", fill: "#000000", align: "center" };
    this.label = game.make.text(-500, -40, "Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet",style);
    this.label.align = "left";
    this.label.anchor.set(0, 0);
    this.sprite.addChild(this.label);
    this.labelWidth = 370;

    this.cancelButton = new GlassLab.UIButton(this.game, -500, 10, this._onCancelPressed, this, 175, 40, 0xffffff, "Nope, reload it", 18);
    this.continueButton = new GlassLab.UIButton(this.game, -310, 10, this._onContinuePressed, this, 175, 40, 0xffffff, "Yes!", 18);
    this.advanceTutorialButton = new GlassLab.UIButton(this.game, -200, 10, this._onAdvanceTutorialPressed, this, 75, 40, 0xffffff, "OK", 18);
    this.advanceTutorialButton.visible = false;
    this.sprite.addChild(this.cancelButton);
    this.sprite.addChild(this.continueButton);
    this.sprite.addChild(this.advanceTutorialButton);

    this.numberOfReloads = 0;
    this.maxReloads = 3;

    this.sprite.visible = false;

    GlassLab.SignalManager.inventoryOpened.add(this._onInventoryOpened, this);
    GlassLab.SignalManager.inventoryClosed.add(this._onInventoryClosed, this);
};

GlassLab.Assistant.STATES = {ORDER_INTRO: "ORDER_INTRO", ORDER_FOOD_CHOSEN: "ORDER_FOOD_CHOSEN", ORDER_CRATE_LOADED: "ORDER_CRATE_LOADED", ORDER_CRATE_READY: "ORDER_CRATE_READY"};

GlassLab.Assistant.TEXT_COLOR = "#000000"; // base color, used to stop highlights
GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR = "#FFB300"; // used to color parts of the text

// For tutorial popup
GlassLab.Assistant.prototype.show = function(text, showButton) {
    this.sprite.visible = true;
    this.showButtons(false);
    this.advanceTutorialButton.visible = showButton;
    this._setText(text);
};

GlassLab.Assistant.prototype.hide = function() {
    if (!this.order) this.sprite.visible = false; // hide ourselves UNLESS we already started an order
    this.advanceTutorialButton.visible = false;
};

// For use when completing an order
GlassLab.Assistant.prototype.startOrder = function(order) {
    this.sprite.visible = true;
    this.numberOfReloads = 0;
    this._enterStateOrderIntro(order);
    this.order = order;
};

GlassLab.Assistant.prototype.endOrder = function(order) {
    this.sprite.visible = false;
    this.order = null;
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
    console.log("order intro");
    this.state = GlassLab.Assistant.STATES.ORDER_INTRO;
    this.showButtons(false);
    var creatureSegment;
    if (order.numCreatures == 1) creatureSegment = "1 " + GLOBAL.creatureManager.GetCreatureName(order.type);
    else creatureSegment = "each of "+order.numCreatures+" "+GLOBAL.creatureManager.GetCreatureName(order.type, true);
    this._setText("I see, an order from "+order.client+" for *enough food to feed "+creatureSegment+"*. What shall I load the crate with?");
};

GlassLab.Assistant.prototype._enterStateOrderFoodChosen = function(foodTypes, lastChance) {
    console.log("order food chosen");
    this.state = GlassLab.Assistant.STATES.ORDER_FOOD_CHOSEN;
    this.showButtons(false);

    if (!foodTypes) {
        this._setText((lastChance? "I'll load this one more time. " : "") + "How much food shall I load into the crate?");
        return;
    }

    // Format the list of food types into "a", "a and b", or "a, b, and c"
    foodTypes = [].concat(foodTypes); // make it an array if it wasn't one
    var food = foodTypes[0] + "s";
    if (foodTypes.length > 2) {
        food += ",";
        for (var i = 1; i < foodTypes.length - 1; i++) {
            food += " " + GlassLab.FoodTypes.getName(foodTypes[i], true);
        }
    }
    if (foodTypes.length > 1) {
        food += " and " + GlassLab.FoodTypes.getName(foodTypes[foodTypes.length-1], true);
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
    console.log("order crate loaded");
    this.state = GlassLab.Assistant.STATES.ORDER_CRATE_LOADED;
    this.showButtons(true);
    var text = "Is this what you wanted?";
    if (this.numberOfReloads) text = "I've reloaded the crate. Is this correct?";
    this._setText(text);
};

GlassLab.Assistant.prototype._enterStateOrderCrateReady = function(lastChance) {
    console.log("order crate ready");
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
    this.label.clearColors();
    if (!text) {
        this.label.text = "";
        return;
    }

    //text = "Assistant:\n" + text; // add the assistant label (for now)

    // Split the text into lines by making sure it doesn't get too wide
    var words = text.split(" ");

    this.label.text = words[0];
    var prevText, testWord;
    for (var i = 1; i < words.length; i++) {
        prevText = this.label.text;
        testWord = words[i].replace("*", ""); // ignore the *s for now
        this.label.text += " "+ testWord; // test what happens if we append the word
        if (this.label.width > this.labelWidth) { // if that makes the label too wide
            this.label.text = prevText + "\n" + words[i]; // make a new line instead
        } else {
            this.label.text = prevText + " " + words[i]; // apply it with a space (but not using the testWord)
        }
    }

    // Then find all the places where we put a * to indicate a color change. These indices have to be offset a little when we see a newline.
    text = this.label.text;
    var colorIndices = [];
    var index = 0; // this index is offset when we see a newline
    for (var k = 0; k < text.length; k++) {
        var char = text.charAt(k);
        if (char == "*") {
            colorIndices.push(index);
            text = text.substring(0, k) + text.substring(k + 1); // remove the *
            k --;
            // Also don't increment the index since we just removed a string
        } else if (char == "\n") {
            // Don't increment the index this time (since the indexing is offset by 1 for each newline)
        } else {
            index ++;
        }
    }
    this.label.text = text;
    for (var j = 0; j < colorIndices.length; j++) {
        var color = (j % 2)? GlassLab.Assistant.TEXT_COLOR : GlassLab.Assistant.HIGHLIGHT_TEXT_COLOR;
        this.label.addColor(color, colorIndices[j]);
    }
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
    this.sprite.y = -200;
};

GlassLab.Assistant.prototype._onInventoryClosed = function() {
    this.sprite.y = -100;
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