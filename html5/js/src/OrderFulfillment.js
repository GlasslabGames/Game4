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

    this.packingLabel = game.make.text(30,20, "Packing List:", {font: "bold 24px Helvetica"});
    this.sprite.addChild(this.packingLabel);

    this.foodTypes = [];
    this.answerInputs = []; // array of answer inputs (for each kind of food)

    for (var i = 0; i < 3; i++) { // for now, assume that we don't have creatures that eat more than 2 kinds of food
        var rowY = 70 + 80 * i;
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

        var label = game.make.text(75, rowY, "100", {font: "bold 40px Helvetica"});
        label.anchor.set(0.5, 0);
        this.sprite.addChild(label);

        var sprite = game.make.sprite(180, rowY + 20, "carrot");
        sprite.anchor.setTo(.5, .5);
        sprite.scale.setTo(.35, .35);
        if (i == 0) { // creature
            sprite.x -= 10;
            sprite.scale.setTo(0.4, 0.4);
        }
        this.sprite.addChild(sprite);

        if (i > 0) { // the first input is for creatures, so we don't have to drag anything onto it
            var dragTarget = new GlassLab.UIDragTarget(game, 200, 60, "drag food type here");
            dragTarget.x = 25;
            dragTarget.y = rowY - 5;
            dragTarget.objectValidator = function(obj) { return obj.foodType; };
            dragTarget.addObjectAsChild = false;
            dragTarget.events.onObjectDropped.add(this.onFoodSet, this);
            this.sprite.addChild(dragTarget).name = "foodSlot"+i;
        }

        this.answerInputs.push({ input: answerInput, errorGraphic: inputErrorGraphic,
            sprite: sprite, label: label, dragTarget: dragTarget});
    }

    this.crateLoaded = false;
    this.submitButton = new GlassLab.UIRectButton(game, 30, 300, this._onSubmit, this, 180, 80, 0xffffff, "Load Crate"); // was 0xffaaff
    this.sprite.addChild(this.submitButton);
    this.submitButton.setEnabled(false);

    /*
    this.orderRequirementLabel = game.make.text(0,0,"",{font: "20px Helvetica", strokeThickness: 1});
    this.orderRequirementLabel.x = 30;
    this.orderRequirementLabel.y = 70;
    this.sprite.addChild(this.orderRequirementLabel);
    */

    this.cancelButton = game.make.button(0, -100, "cancelButton", function(){
        this.Hide(true);
        GlassLabSDK.saveTelemEvent("cancel_order", {});
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

GlassLab.OrderFulfillment.prototype._refreshPen = function(response) {
    if (!response) response = this._getResponse();

    if (response) {
        var numCreatures = response.shift();
        this._createPen(response.length);
        this.pen.SetContents(this.data.type, numCreatures, this.foodTypes, response);

        this._focusCamera();
    } else if (this.data.numCreatures) { // create a pen showing only the creatures as long as we know how many creatures there are
        this._createPen();
        this.pen.SetContents(this.data.type, this.data.numCreatures, this.foodTypes, []);

    } else if (this.pen) { // we have a pen with no purpose, so remove it
        this.pen.sprite.destroy();
        this.pen = null;
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
        if (this.answerInputs[i].label.visible) {
            response.push ( this.answerInputs[i].label.text ); // preset amount
            continue;
        } else if (!this.answerInputs[i].input.visible) continue; // not set

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
    if (!this.pen || !this.pen.sprite.game) { // TODO check for game is a hack since sprite may have been destroyed by level loading
        // Make a pen with the correct number of sections for the number of food types we have
        var widths = [1];
        for (var j = 0; j < numFoodTypes; j++) widths.push(0);
        this.pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, null, 1, widths);
        this.pen.allowFeedButton = false;
        this.pen.forShipment = true;
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

    this.submitButton.label.text = "Load Crate";

    this.data = data;
    this.Refresh();

    this.crateLoaded = false;
    GLOBAL.assistant.startOrder(data);

    GLOBAL.ordersButton.visible = false;
    GLOBAL.inventoryMenu.Show(true);

    this._sendTelemetry("start_order");
    GlassLab.SignalManager.orderStarted.dispatch(this.data);
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
    GLOBAL.inventoryMenu.Hide(true);
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{
    if (!this.data)
    {
        console.error("No data to refresh with!");
        return;
    }

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.type).desiredFood;
    this.foodTypes[0] = (this.data.numFoodA)? desiredFood[0].type : null;
    this.foodTypes[1] = (this.data.numFoodB)? desiredFood[1].type : null;

    this._refreshAnswerInputs();
    this._refreshPen();

    // refresh the submit button
    this.submitButton.setEnabled( this._getResponse() );
};

GlassLab.OrderFulfillment.prototype._refreshAnswerInputs = function() {
    // First, the creature
    var creatureInput = this.answerInputs[0];
    creatureInput.label.visible = this.data.numCreatures;
    creatureInput.label.text = this.data.numCreatures || 0;
    creatureInput.input.visible = !this.data.numCreatures;
    var spriteName = GLOBAL.creatureManager.GetCreatureData(this.data.type).spriteName + "_art";
    if (creatureInput.sprite.spriteName != spriteName) creatureInput.sprite.loadTexture( spriteName );

    // Then the two food inputs
    var visibleDragTargets = 0;
    var maxFoods = GLOBAL.creatureManager.GetCreatureData(this.data.type).desiredFood.length;
    for (var i = 1; i < this.answerInputs.length; i++) {
        var input = this.answerInputs[i];
        var foodType = this.foodTypes[i - 1];

        input.dragTarget.visible = !foodType && visibleDragTargets < 1 && i <= maxFoods;
        input.sprite.visible = foodType;

        if (foodType) {
            var presetAmount = (i == 1)? this.data.numFoodA : this.data.numFoodB;
            input.label.visible = presetAmount;
            input.label.text = presetAmount || 0;
            input.input.visible = !presetAmount;

            var spriteName = GlassLab.FoodTypes[foodType].spriteName;
            if (input.sprite.spriteName != spriteName) input.sprite.loadTexture( spriteName );
        } else {
            input.label.visible = false;
            input.input.visible = false;
            visibleDragTargets ++;
        }
    }
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    if (!this.crateLoaded) { // need to load the crate for the first time
        var response = this._getResponse(true);
        if (response) {
            this._refreshPen(response);
            this.submitButton.label.text = "Ship Crate!";
            this.submitButton.setEnabled(false);
            for (var i = 0; i < this.answerInputs.length; i++) {
                this.answerInputs[i].input.setEnabled(false);
            }
            GLOBAL.assistant.onPenLoaded();
            this.crateLoaded = true;

            this._sendTelemetry("pack_order", true); // FIXME
        }
    } else { // actually ship the crate
        var response = this._getResponse(true);

        if (response) {
            this.pen.FeedCreatures();
            this.Hide();

            this._sendTelemetry("submit_order_answer", true);

        }
    }

};

// From the assistant's dialogue
GlassLab.OrderFulfillment.prototype.restartLoading = function(numAttempts)
{
    this.submitButton.label.text = "Load Crate";
    this.crateLoaded = false;
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetText("");
        this.answerInputs[i].input.setEnabled(true);
    }
    this._refreshPen();
    GlassLabSDK.saveTelemEvent("retry_order", {retry_count: numAttempts});
};

GlassLab.OrderFulfillment.prototype.onFoodSet = function(inventorySlot, dragTarget) {
    for (var i = 0; i < this.answerInputs.length; i++) {
        if (this.answerInputs[i].dragTarget == dragTarget) {
            this.foodTypes[i] = inventorySlot.foodType;
        }
    }
    this._refreshAnswerInputs();
};

GlassLab.OrderFulfillment.prototype._sendTelemetry = function(eventName, calculateSuccess) {
    // Telemetry - for now we only allow them to set the food, not to set the number of creatures. FIXME later.
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.data.type);
    var response = this._getResponse();
    var data = {
        creature_type: this.data.type,
        creature_count: this.data.numCreatures,
        target_creature_count: this.data.numCreatures,
        foodA_type: this.foodTypes[0] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type || "",
        foodB_type: this.foodTypes[1] || "",
        target_foodB_type: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].type : ""),
        foodA_count: response[0] || 0,
        target_foodA_count: creatureInfo.desiredFood[0].amount * this.data.numCreatures,
        foodB_count: response[1] || 0,
        target_foodB_count: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].amount : 0) * this.data.numCreatures
    };
    if (calculateSuccess) {
        // check that the food type & counts match the target, or are swapped (A matches B, etc)
        data.success = data.creature_count == data.target_creature_count && (
        (data.foodA_type == data.target_foodA_type && data.foodB_type == data.target_foodB_type
            && data.foodA_count == data.target_foodA_count && data.foodB_count == data.target_foodB_count) ||
        (data.foodA_type == data.target_foodB_type && data.foodB_type == data.target_foodA_type
        && data.foodA_count == data.target_foodB_count && data.foodB_count == data.target_foodA_count));
    }
    GlassLabSDK.saveTelemEvent(eventName, data);
};