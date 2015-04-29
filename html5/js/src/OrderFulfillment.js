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

    this.bg = game.make.sprite(0,0,"orderBg");
    this.bg.anchor.setTo(1,1);
    this.sprite.addChild(this.bg);

    var foodScale = 0.75;

    // The total food label is special and above the other answer inputs
    this.totalFoodRoot = game.make.sprite(-180, -315);
    var totalFoodSprite1 = game.make.sprite(0, 0, "apple");
    totalFoodSprite1.anchor.setTo(.5, .5);
    totalFoodSprite1.scale.setTo(foodScale * 0.8, foodScale * 0.8);
    this.totalFoodRoot.addChild(totalFoodSprite1);

    var totalFoodSprite2 = game.make.sprite(60, 0, "apple");
    totalFoodSprite2.anchor.setTo(.5, .5);
    totalFoodSprite2.scale.setTo(foodScale * 0.8, foodScale * 0.8);
    this.totalFoodRoot.addChild(totalFoodSprite2);
    this.totalFoodSprites = [totalFoodSprite1, totalFoodSprite2];

    var plusLabel = game.make.text(30, 0, "+",  {font: "bold 20px Helvetica"});
    plusLabel.anchor.setTo(.5, .5);
    this.totalFoodRoot.addChild(plusLabel);

    var equalsLabel = game.make.text(95, 0, "=", {font: "bold 20px Helvetica"});
    equalsLabel.anchor.setTo(.5, .5);
    this.totalFoodRoot.addChild(equalsLabel);

    this.totalFoodLabel = game.make.text(120, 0, "100", {font: "bold 20px Helvetica"});
    this.totalFoodLabel.anchor.setTo(.5, .5);
    this.totalFoodRoot.addChild(this.totalFoodLabel);

    this.sprite.addChild(this.totalFoodRoot);

    this.foodTypes = [];
    this.answerInputs = []; // array of answer inputs (for each kind of food)
    this.answerInputRoot = game.make.sprite(-180, -275);
    this.sprite.addChild(this.answerInputRoot);

    for (var i = 0; i < 3; i++) { // 3 inputs = the creature, foodA, and foodB
        var rowY = 65 * i;
        var answerInput = new GlassLab.UITextInput(game, GlassLab.UITextInput.InputType.NUMERIC, "orderEntryField");
        answerInput.x = 50;
        answerInput.y = rowY;
        answerInput.SetInputLimit(3);
        this.answerInputRoot.addChild(answerInput);

        var inputErrorGraphic = this.game.make.graphics();
        answerInput.events.onTextChange.add(this._onTextChange, this);
        var answerInputBounds = answerInput.getLocalBounds();
        inputErrorGraphic.drawRect(-20,-20,answerInputBounds.width+60, answerInputBounds.height+40); // was .beginFill(0xFF4444)
        inputErrorGraphic.alpha = 0;
        answerInput.addChild(inputErrorGraphic);

        var label = game.make.text(75, rowY, "100", {font: "bold 40px Helvetica"});
        label.anchor.set(0.5, 0);
        this.answerInputRoot.addChild(label);

        var sprite = game.make.sprite(10, rowY + 20, "apple");
        sprite.anchor.setTo(.5, .5);
        sprite.scale.setTo(foodScale, foodScale);
        if (i == 0) { // creature
            sprite.scale.setTo(-0.25, 0.25);
        }
        this.answerInputRoot.addChild(sprite);

        if (i > 0) { // the first input is for creatures, so we don't have to drag anything onto it
            var dragTarget = new GlassLab.UIDragTarget(game, 160, 50, "orderDragTarget");
            dragTarget.x = -20;
            dragTarget.y = rowY - 5;
            dragTarget.objectValidator = function(obj) { return obj.foodType; };
            dragTarget.addObjectAsChild = false;
            dragTarget.events.onObjectDropped.add(this.onFoodSet, this);
            this.answerInputRoot.addChild(dragTarget).name = "foodSlot"+i;
        }

        this.answerInputs.push({ input: answerInput, errorGraphic: inputErrorGraphic,
            sprite: sprite, label: label, dragTarget: dragTarget});
    }

    this.crateLoaded = false;
    this.submitButton = new GlassLab.UIRectButton(game, -200, -80, this._onSubmit, this, 180, 60, 0xffffff, "Load Crate");
    this.sprite.addChild(this.submitButton);
    this.submitButton.setEnabled(false);

    this.sprite.visible = false;

    game.scale.onSizeChange.add(this._onScreenSizeChange, this);
};

// When text is UITextInput is changed
GlassLab.OrderFulfillment.prototype._onTextChange = function(text)
{
    // this._refreshPen();
    // Currently we don't refresh the pen until the player hits "Load Crate". Possibly we'll want to toggle the behavior in the future.

    this.submitButton.setEnabled( this._getResponse() ); // enable the submit button when they've entered all numbers
};

GlassLab.OrderFulfillment.prototype._refreshPen = function(response) {
    if (!this.crate) {
        this.crate = new GlassLab.ShippingPen(this.game);
    }
    this.crate.reset();

    if (!response) response = this._getResponse();

    // if hint is true, we have two options
    // if numCreatures is provided, add one row of food.
    // else, show the pen with the correct dimensions of food
    if (response) {
        var numCreatures = response.shift();
        var creatureWidth = this.data.creatureWidth || GLOBAL.creatureManager.getMinCreatureCols(this.data.creatureType) || 1;
        this.crate.setContents(this.data.creatureType, numCreatures, this.foodTypes, response, creatureWidth);

        this.focusCamera();
    } else if (this.data.hint) { // for a hint, show one row of food
        var creatureWidth = this.data.creatureWidth || GLOBAL.creatureManager.getMinCreatureCols(this.data.creatureType) || 1;
        var creatureMult; // determines how much food to show.
        if (this.data.numCreatures) { // when the number of creatures is provided, give them a hint of a single row of food
            creatureMult = creatureWidth;
        } else {
            creatureMult = this._calculateTargetNumCreatures(); // otherwise, give them enough food for all the creatures.
        }

        var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood;
        var foodCounts = [desiredFood[0].amount * creatureMult];
        var foodTypes = [desiredFood[0].type];
        if (desiredFood[1]) {
            foodCounts[1] = desiredFood[1].amount * creatureMult;
            foodTypes[1] = desiredFood[1].type;
        }
        this.crate.setContents(this.data.creatureType, this.data.numCreatures || creatureMult, foodTypes, foodCounts,
            creatureWidth, !this.data.numCreatures, this.data.numCreatures); // (hideCreatures, singleFoodRow)

    } else if (this.crate) { // we have a pen with no purpose, so remove it
        this.crate.hide();
    }

    this.focusCamera();
};

GlassLab.OrderFulfillment.prototype.focusCamera = function() {

    // The pen is already set to be centered, so we can center the camera (with some offset for the UI)
    var xOffset = -75;
    var yOffset = 100;
    this.game.camera.x = -this.game.camera.width * 0.5 + xOffset;
    this.game.camera.y = -this.game.camera.height * 0.5 + yOffset;
    if (this.crate && this.crate.sprite.visible) {
        var maxDimension = Math.max(this.crate.getFullWidth(), this.crate.height);
        GLOBAL.UIManager.zoomTo(2.5 / maxDimension);
    }

    GLOBAL.tiledBg.width = this.game.width / GLOBAL.UIManager.zoomLevel * 1.25; // padding to cover a weird edge when full screen;
    GLOBAL.tiledBg.height = this.game.height / GLOBAL.UIManager.zoomLevel;
    GLOBAL.tiledBg.position.setTo(xOffset / GLOBAL.UIManager.zoomLevel, yOffset / GLOBAL.UIManager.zoomLevel);
};

GlassLab.OrderFulfillment.prototype._getResponse = function() {
    var response = [];
    var valid = true;
    for (var i = 0; i < this.answerInputs.length; i++) {
        if (this.answerInputs[i].input.visible) { // look at what they entered in the text field
            var amount = parseInt( this.answerInputs[i].input.GetText());
            if (!amount || amount <= 0) {
                valid = false;
            }
            response.push(amount);
        } else if (this.answerInputs[i].label.visible || this.data.totalNumFood) { // use whatever amount was preset
            response.push( this.answerInputs[i].label.text );
        } else if (this.answerInputs[i].dragTarget.visible) { // they haven't dragged any food here yet
            valid = false;
        }
    }
    if (!valid) return false;
    else return response;
};

GlassLab.OrderFulfillment.prototype.show = function(data)
{
    this.sprite.visible = true;
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetText("");
        this.answerInputs[i].input.setEnabled(true);
    }

    this.submitButton.label.text = "Load Crate";

    this.data = data;
    if (!this.data.creatureType) this.data.creatureType = this.data.type; // fixing some inconsistency
    this.Refresh();

    this.crateLoaded = false;
    GLOBAL.assistant.startOrder(data);

    this._sendTelemetry("start_order");
    GlassLab.SignalManager.orderStarted.dispatch(this.data);

    GLOBAL.inventoryMenu.show(true); // show this after sending the event so that we don't have to refresh the inventory again
};

GlassLab.OrderFulfillment.prototype.hide = function(destroyPen)
{
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetFocus(false);
    }
    this.sprite.visible = false;

    if (destroyPen && this.crate)
    {
        this.crate.hide();
    }

    GLOBAL.assistant.endOrder();
    GLOBAL.inventoryMenu.hide(true);
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{
    if (!this.data)
    {
        console.error("No data to refresh with!");
        return;
    }

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood;
    this.foodTypes[0] = (this.data.numFoodA || this.data.noFoodEntries)? desiredFood[0].type : null;
    this.foodTypes[1] = (this.data.numFoodB || this.data.noFoodEntries)? desiredFood[1].type : null;

    var offsetY = false;
    if (this.data.totalNumFood) {
        if (this.data.noFoodEntries) {  // we can use the shorter bg and move things down
            if (this.bg.key != "orderBg") this.bg.loadTexture("orderBg");
            offsetY = true;
            // also calculate the correct food division so that we can show it in the pen later
            var total = desiredFood[0].amount + desiredFood[1].amount;
            this.data.numFoodA = (desiredFood[0].amount / total) * this.data.totalNumFood;
            this.data.numFoodB = (desiredFood[1].amount / total) * this.data.totalNumFood;
        } else {
            if (this.bg.key != "orderBg2") this.bg.loadTexture("orderBg2");
        }
        this.totalFoodRoot.visible = true;
        this.totalFoodSprites[0].loadTexture(GlassLab.FoodTypes[desiredFood[0].type].spriteName);
        this.totalFoodSprites[1].loadTexture(GlassLab.FoodTypes[desiredFood[1].type].spriteName);
        this.totalFoodLabel.text = this.data.totalNumFood;
    } else {
        if (this.bg.key != "orderBg") this.bg.loadTexture("orderBg");
        this.totalFoodRoot.visible = false;
    }
    this.totalFoodRoot.y = (offsetY)? -250 : -315;
    this.answerInputRoot.y = (offsetY)? -210 : -275;

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
    var spriteName = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).spriteName + "_art";
    if (creatureInput.sprite.spriteName != spriteName) creatureInput.sprite.loadTexture( spriteName );

    // Then the two food inputs
    var visibleDragTargets = 0;
    var maxFoods = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood.length;
    for (var i = 1; i < this.answerInputs.length; i++) {
        var input = this.answerInputs[i];
        var foodType = this.foodTypes[i - 1];

        // check if the drag target should be visible
        input.dragTarget.visible = !foodType && visibleDragTargets < 1 && i <= maxFoods;
        if (input.dragTarget.visible) {
            visibleDragTargets++; // never show more than one drag target
            input.dragTarget.setEnabled(true);
        }

        // then, if the food type is set, we can show the sprite and the entry field or the preset amount
        if (foodType) {
            var presetAmount = (i == 1)? this.data.numFoodA : this.data.numFoodB;
            input.label.visible = presetAmount && !this.data.noFoodEntries;
            input.label.text = presetAmount || 0;
            input.input.visible = !presetAmount && !this.data.noFoodEntries; // if the amount isn't preset, show the entry field

            var spriteName = GlassLab.FoodTypes[foodType].spriteName;
            input.sprite.visible = !this.data.noFoodEntries;
            if (input.sprite.spriteName != spriteName) input.sprite.loadTexture( spriteName );
        } else {
            input.sprite.visible = false;
            input.label.visible = false;
            input.input.visible = false;
        }
    }
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    if (!this.crateLoaded) { // need to load the crate for the first time
        var response = this._getResponse();
        if (response) {
            this._refreshPen(response);
            this.submitButton.setEnabled(false);
            for (var i = 0; i < this.answerInputs.length; i++) {
                var answerInput = this.answerInputs[i];
                answerInput.input.setEnabled(false);
                if (answerInput.dragTarget)
                {
                    answerInput.dragTarget.setEnabled(false);
                }
            }
            GLOBAL.assistant.onPenLoaded();
            this.crateLoaded = true;

            this._sendTelemetry("pack_order", true);
        }
    }
};

GlassLab.OrderFulfillment.prototype.shipCrate = function() {
    var response = this._getResponse();

    if (response) {
        this.crate.ship();
        this.crate.onShipped.addOnce(this._crateShipped, this);
        this._sendTelemetry("submit_order_answer", true);
    }
    else
    {
        console.error("No response for crate ship");
    }
};

GlassLab.OrderFulfillment.prototype._crateShipped = function() {
    this.data.outcome = this.crate.result;
    this.data.outcomeDetail = this.crate.problemFood;

    if (this.crate.result == GlassLab.results.satisfied && this.data.totalNumFood) { // we need to check that the number of creatures is correct
        var numCreatures = this._getResponse()[0];
        var targetNumCreatures = this._calculateTargetNumCreatures();
        if (numCreatures < targetNumCreatures) {
            this.data.outcome = GlassLab.results.wrongCreatureNumber;
            this.data.outcomeDetail = "few"; // they sent too few creatures
        } else if (numCreatures > targetNumCreatures) {
            this.data.outcome = GlassLab.results.wrongCreatureNumber;
            this.data.outcomeDetail = "many"; // they sent too many creatures
        }
    }
    console.log("Crate shipped! Outcome:",this.data.outcome, "Problem:",this.data.outcomeDetail);

    GLOBAL.mailManager.completeOrder(this.data, this.data.outcome);
};


// From the assistant's dialogue
GlassLab.OrderFulfillment.prototype.restartLoading = function(numAttempts)
{
    this.submitButton.label.text = "Load Crate";
    this.crateLoaded = false;
    for (var i = 0; i < this.answerInputs.length; i++) {
        var answerInput = this.answerInputs[i];
        answerInput.input.SetText("");
        answerInput.input.setEnabled(true);
        if (answerInput.dragTarget)
        {
            answerInput.dragTarget.setEnabled(true);
        }
    }
    
    this._refreshPen();
    GlassLabSDK.saveTelemEvent("retry_order", {retry_count: numAttempts});
};

GlassLab.OrderFulfillment.prototype.onFoodSet = function(inventorySlot, dragTarget) {
    for (var i = 0; i < this.answerInputs.length; i++) {
        if (this.answerInputs[i].dragTarget == dragTarget) {
            this.foodTypes[i - 1] = inventorySlot.foodType; // subtract 1 since the first answer input is the creature
        }
    }
    this._refreshAnswerInputs();
};

GlassLab.OrderFulfillment.prototype._sendTelemetry = function(eventName, calculateSuccess) {
    // Telemetry
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType);
    var response = this._getResponse();

    // figure out the correct answer
    var targetNumCreatures = this._calculateTargetNumCreatures();

    var data = {
        order_id: this.data.id || "",
        key: this.data.key || false,
        creature_type: this.data.creatureType,
        creature_count: response[0] || 0,
        target_creature_count: targetNumCreatures,
        foodA_type: this.foodTypes[0] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type || "",
        foodB_type: this.foodTypes[1] || "",
        target_foodB_type: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].type : ""),
        foodA_count: response[1] || 0,
        target_foodA_count: creatureInfo.desiredFood[0].amount * targetNumCreatures,
        foodB_count: response[2] || 0,
        target_foodB_count: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].amount : 0) * targetNumCreatures,
        total_food: this.data.totalNumFood || 0
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

GlassLab.OrderFulfillment.prototype._calculateTargetNumCreatures = function() {
    if (this.data.numCreatures) return this.data.numCreatures;

    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType);

    if (this.data.numFoodA) return this.data.numFoodA / creatureInfo.desiredFood[0].amount;
    else if (this.data.numFoodB) return this.data.numFoodB / creatureInfo.desiredFood[1].amount;
    else if (this.data.totalNumFood) {
        return this.data.totalNumFood / (creatureInfo.desiredFood[0].amount + creatureInfo.desiredFood[1].amount);
    }
    return -1;
};

GlassLab.OrderFulfillment.prototype._onScreenSizeChange = function() {
    if (this.sprite.visible) this.focusCamera();
};