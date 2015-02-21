/**
 * Created by Jerry Fu on 1/26/2015.
 */


var GlassLab = GlassLab || {};

/**
 * OrderFulfillment
 */

GlassLab.OrderFulfillment = function(game)
{
    this.game = game;
    this.sprite = game.make.sprite();

    this.bg = game.make.graphics();
    this.bg.beginFill(0xFFFFFF).lineStyle(4, 0x000000, 1).drawRect(0,0,250,400);
    this.sprite.addChild(this.bg);

    this.packingLabel = game.make.text(30,30, "Packing List:", {font: "20px Helvetica", strokeThickness: 1});
    this.sprite.addChild(this.packingLabel);

    this.foodTypes = [];
    this.answerInputs = []; // array of answer inputs (for each kind of food)

    for (var i = 0; i < 2; i++) { // for now, assume that we don't have creatures that eat more than 2 kinds of food
        var rowY = 120 + 80 * i;
        var answerInput = new GlassLab.UITextInput(game, GlassLab.UITextInput.InputType.NUMERIC);
        answerInput.x = 50;
        answerInput.y = rowY;
        answerInput.SetInputLimit(2);
        this.sprite.addChild(answerInput);

        var inputErrorGraphic = this.game.make.graphics();
        answerInput.events.onTextChange.add(this._onTextChange, this);
        var answerInputBounds = answerInput.getLocalBounds();
        inputErrorGraphic.drawRect(-20,-20,answerInputBounds.width+60, answerInputBounds.height+40); // was .beginFill(0xFF4444)
        inputErrorGraphic.alpha = 0;
        answerInput.addChild(inputErrorGraphic);

        var xLabel = game.make.text(120, rowY, "x");
        this.sprite.addChild(xLabel);

        var foodSprite = game.make.sprite(180, rowY + 30, "carrot");
        foodSprite.anchor.setTo(.5, .5);
        foodSprite.scale.setTo(.4, .4);
        this.sprite.addChild(foodSprite);

        var dragTarget = new GlassLab.UIDragTarget(game, 200, 60, "drag food type here");
        dragTarget.x = 25;
        dragTarget.y = rowY - 5;
        dragTarget.objectValidator = function(obj) { return (obj instanceof GlassLab.InventoryMenuSlot);};
        dragTarget.addObjectAsChild = false;
        dragTarget.events.onObjectDropped.add(this.onFoodSet, this);
        this.sprite.addChild(dragTarget).name = "foodSlot"+i;

        this.answerInputs.push({ input: answerInput, errorGraphic: inputErrorGraphic,
            foodSprite: foodSprite, xLabel: xLabel, dragTarget: dragTarget});
    }

    this.crateLoaded = false;
    this.submitButton = new GlassLab.UIButton(game, 30, 280, this._onSubmit, this, 180, 80, 0xffffff, "Load Crate"); // was 0xffaaff
    this.sprite.addChild(this.submitButton);
    this.submitButton.setEnabled(false);

    this.orderRequirementLabel = game.make.text(0,0,"",{font: "20px Helvetica", strokeThickness: 1});
    this.orderRequirementLabel.x = 30;
    this.orderRequirementLabel.y = 70;
    this.sprite.addChild(this.orderRequirementLabel);

    this.cancelButton = game.make.button(0, -100, "cancelButton", function(){
        this.Hide(true);
    }, this);
    this.sprite.addChild(this.cancelButton);

    this.sprite.visible = false;

    GlassLab.SignalManager.feedingPenResolved.add(this._onPenResolved, this);
};

// When text is UITextInput is changed
GlassLab.OrderFulfillment.prototype._onTextChange = function(text)
{
    // this._refreshPen();
    // Currently we don't refresh the pen until the player hits "Load Crate". Possibly we'll want to toggle the behavior in the future.

    this.submitButton.setEnabled( this._getResponse() ); // enable the submit button when they've entered all numbers
};

GlassLab.OrderFulfillment.prototype._refreshPen = function() {
    var response = this._getResponse();

    if (response) {
        this._createPen(this.foodTypes.length);
        this.pen.SetContents(this.data.type, this.data.numCreatures, this.foodTypes, response);

        this._focusCamera();
    }
};

GlassLab.OrderFulfillment.prototype._focusCamera = function() {
    // Center the pen at the top of the screen, and zoom out if required
    this.game.camera.x = -this.game.camera.width * 0.7;
    this.game.camera.y = -this.game.camera.height * 0.2;
    // TODO: zoom appropriately
};

GlassLab.OrderFulfillment.prototype._getResponse = function(flashErrorGraphics) {
    var response = [];
    var valid = true;
    for (var i = 0; i < this.answerInputs.length; i++) {
        if (!this.answerInputs[i].input.visible) continue;
        var amount = parseInt( this.answerInputs[i].input.GetText());
        if (!amount || amount <= 0) {
            valid = false;
            if (flashErrorGraphics) {
                this.answerInputs[i].errorGraphic.alpha = 1;
                this.game.add.tween(this.answerInputs[i].errorGraphic).to( {alpha: 0}, 500, "Linear", true);
            }
        }
        response.push( amount );
    }
    if (!valid) return false;
    else return response;
};

GlassLab.OrderFulfillment.prototype._createPen = function(numFoodTypes) {
    if (numFoodTypes && this.pen && this.pen.widths.length != numFoodTypes+1) {
        this.pen.sprite.destroy();
        this.pen = null;
    }
    if (!this.pen) {
        // Make a pen with the correct number of sections for the number of food types we have
        var widths = [1];
        for (var j = 0; j < numFoodTypes; j++) widths.push(0);
        this.pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, null, 1, widths);
        this.pen.allowFeedButton = false;
    }
    this._focusCamera();
};

GlassLab.OrderFulfillment.prototype._onPenResolved = function(pen, correct)
{
    if (pen == this.pen)
    {
        this.data.fulfilled = correct;

        if (correct)
        {
            GlassLab.SignalManager.orderCompleted.dispatch(this.data);
        }
        else
        {
            GlassLab.SignalManager.orderFailed.dispatch(this.data);
        }
    }
};

GlassLab.OrderFulfillment.prototype.Show = function(data)
{
    this.sprite.visible = true;
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetText("");
        this.answerInputs[i].input.setEnabled(true);
    }
    if (data)
    {
        this.data = data;
        this.Refresh();
    }
    this.crateLoaded = false;

    this._createPen();
    this.pen.SetContents(this.data.type, this.data.numCreatures);

    GLOBAL.assistant.startOrder(data);

    GLOBAL.ordersButton.visible = false;
    GLOBAL.inventoryMenu.Show();
};

GlassLab.OrderFulfillment.prototype.Hide = function(destroyPen)
{
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetFocus(false);
    }
    this.sprite.visible = false;

    if (destroyPen && this.pen)
    {
        this.pen.sprite.destroy();
        this.pen = null;
    }

    GLOBAL.assistant.endOrder();
    GLOBAL.ordersButton.visible = true;
    GLOBAL.inventoryMenu.Hide();
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{
    if (!this.data)
    {
        console.error("No data to refresh with!");
        return;
    }

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.type).desiredFood;

    this.foodTypes = [];
    /*for (var j = 0; j < desiredFood.length; j++) {
        this.foodTypes.push( desiredFood[j].type );
    }*/

    this._createPen(this.foodTypes.length);

    this._refreshAnswerInputs();

    // num creatures
    this.orderRequirementLabel.setText(this.data.numCreatures + " " + this.data.type);
};

GlassLab.OrderFulfillment.prototype._refreshAnswerInputs = function() {
    var visibleDragTargets = 0;
    for (var i = 0; i < this.answerInputs.length; i++) {
        var foodType = this.foodTypes[i];
        if (foodType) {
            for (var key in this.answerInputs[i]) {
                this.answerInputs[i][key].visible = (key != "dragTarget");
            }
            var spriteName = GlassLab.FoodTypes[foodType].spriteName;
            if (this.answerInputs[i].foodSprite.spriteName != spriteName) this.answerInputs[i].foodSprite.loadTexture( spriteName );
        } else {
            // Hide everything except the drag target, and only show that if we don't have one already
            for (var key in this.answerInputs[i]) {
                this.answerInputs[i][key].visible = (key == "dragTarget" && visibleDragTargets == 0);
            }
            visibleDragTargets ++;
        }
    }
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    if (!this.crateLoaded) {
        var response = this._getResponse(true);
        if (response) {
            this._refreshPen();
            this.submitButton.label.text = "Ship Crate!";
            this.submitButton.setEnabled(false);
            for (var i = 0; i < this.answerInputs.length; i++) {
                this.answerInputs[i].input.setEnabled(false);
            }
            GLOBAL.assistant.onPenLoaded();
            this.crateLoaded = true;
        }
    } else {
        var response = this._getResponse(true);

        if (response) {
            this.pen.FeedCreatures();
            this.Hide();
        }
    }

};

// From the assistant's dialogue
GlassLab.OrderFulfillment.prototype.restartLoading = function()
{
    this.submitButton.label.text = "Load Crate";
    this.crateLoaded = false;
    var numFoods = [];
    for (var j = 0; j < this.foodTypes.length; j++) numFoods.push(0);
    this.pen.SetContents(this.data.type, this.data.numCreatures, this.foodTypes, numFoods);
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetText("");
        this.answerInputs[i].input.setEnabled(true);
    }
};

GlassLab.OrderFulfillment.prototype.onFoodSet = function(inventorySlot, dragTarget) {
    for (var i = 0; i < this.answerInputs.length; i++) {
        if (this.answerInputs[i].dragTarget == dragTarget) {
            this.foodTypes[i] = inventorySlot.foodType;
        }
    }
    this._refreshAnswerInputs();
};