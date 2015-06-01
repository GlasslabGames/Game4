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
    this.bg = GlassLab.Util.PixelSnapAnchor(this.bg);
    this.sprite.addChild(this.bg);

    this.answerInputRoot = new GlassLab.UITable(game, 1, 30);//game.make.sprite(-205, -270);
    this.answerInputRoot.x = -205;
    this.sprite.addChild(this.answerInputRoot);

    this.creatureInput = new GlassLab.OrderFulfillmentSlot(game, 0, 0, -1, true);
    this.creatureInput.answerInput.events.onTextChange.add(this._onTextChange, this);
    this.creatureInput.sprite.scale.setTo(0.5, 0.5);
    this.creatureInput.sprite.y -= 3;
    this.answerInputRoot.addManagedChild(this.creatureInput);

    this.foodInputs = []; // array of answer inputs (for each kind of food)
    for (var i = 0; i < 2; i++) { // 3 inputs = the creature, foodA, and foodB
        var input = new GlassLab.OrderFulfillmentSlot(game, 0, 0, i, false);
        this.answerInputRoot.addManagedChild(input, true);
        this.foodInputs.push(input);
        input.answerInput.events.onTextChange.add(this._onTextChange, this);
        input.onFoodSet.add(this._onFoodSet, this);
    }

    this.totalFoodInput = new GlassLab.OrderFulfillmentSlot(game, 0, 0, -1, true, true);
    this.totalFoodInput.answerInput.events.onTextChange.add(this._onTextChange, this);
    this.answerInputRoot.addManagedChild(this.totalFoodInput);

    this.crateLoaded = false;
    this.submitButton = new GlassLab.OrderFulfillmentButton(game, 0, 0, this._onSubmit, this);
    this.submitButton.anchor.setTo(1, 1);
    this.sprite.addChild(this.submitButton);
    this.submitButton.setEnabled(false);

    var paperClip = this.sprite.addChild(this.game.make.sprite(0, 0, "paperClip"));
    paperClip.anchor.setTo(1,1);

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

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood;
    var creatureWidth = this.data.creatureWidth || GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).eatingGroup || 1;

    if (response) {
        // If noFoodEntries is true, we have to figure out what foodTypes and counts to use
        var foodTypes = [], foodCounts = [];
        if (this.data.noFoodEntries) {
            foodTypes.push(desiredFood[0].type, desiredFood[1].type); // get the food types this creature wants
            var total = desiredFood[0].amount + desiredFood[1].amount;
            var food1 = Math.round((desiredFood[0].amount / total) * response.totalFood);
            foodCounts.push( food1, response.totalFood - food1 );
        } else {
            foodTypes.push(this.foodInputs[0].currentType);
            if (response.food.length > 1) foodTypes.push(this.foodInputs[1].currentType);
            foodCounts = response.food;
        }

        this.crate.setContents(this.data.creatureType, response.creatures, foodTypes, foodCounts, creatureWidth);
    } else if (this.data.hint) {
        // hint 1: a single complete row, with a total food popup if applicable
        // hint 2: a full size pen with the known info filled in as well as a single complete row (with total food popup if applicable)
        var creatureCount = this._calculateTargetNumCreatures();

        var foodTypes = [ desiredFood[0].type ];
        var foodCounts = [ desiredFood[0].amount * creatureCount ];
        if (desiredFood.length > 1) {
            foodTypes.push( desiredFood[1].type );
            foodCounts.push( desiredFood[1].amount * creatureCount );
        }

        var singleCreatureRow = this.data.hint == 1 || (this.data.hint > 1 && !this.data.numCreatures);
        var singleFoodRow = this.data.hint == 1 || (this.data.hint > 1 && this.data.numCreatures);

        this.crate.setContents(this.data.creatureType, creatureCount, foodTypes, foodCounts, creatureWidth,
            singleCreatureRow, singleFoodRow, (this.data.totalNumFood || this.data.askTotalFood));
    } else if (this.crate) { // we have a pen with no purpose, so remove it
        this.crate.hide();
    }

    this.focusCamera();
};

GlassLab.OrderFulfillment.prototype.focusCamera = function() {

    // The pen is already set to be centered, so we can center the camera (with some offset for the UI)
    var xOffset = -85;
    var yOffset = 100;
    GLOBAL.UIManager.setCenterCameraPos(xOffset, yOffset, true);

    var prevBgHeight = GLOBAL.tiledBg.height;
    if (this.crate) {
        // To figure out how much we need to zoom out, we have to use the crate's non-isometric size
        var width = GlassLab.Pen.CalculateProjectedWidth(this.crate.getFullWidth(), this.crate.height);
        if (width) {
            var zoom = 450 / width; // we don't want UIManager to enforce the bounds since we can go as small as we need too.. but don't go closer than 1 either
            GLOBAL.UIManager.zoomTo(zoom, true);
        }
    }

    // if we're zooming out, resize the tiledBg. Else leave it larger so we don't have to stress about the animated zoom
    if (this.game.height / GLOBAL.UIManager.zoomLevel > prevBgHeight) {
        GLOBAL.tiledBg.width = this.game.width / GLOBAL.UIManager.zoomLevel * 1.25; // padding to cover a weird edge when full screen;
        GLOBAL.tiledBg.height = this.game.height / GLOBAL.UIManager.zoomLevel;
        GLOBAL.tiledBg.position.setTo(xOffset / GLOBAL.UIManager.zoomLevel, yOffset / GLOBAL.UIManager.zoomLevel);
    }
};

GlassLab.OrderFulfillment.prototype._getResponse = function(dontAbort) {
    var response = {};
    // Figure out how many food entries we expect (0 if no food entries, 1 for baby creatures, 2 for adult creatures)
    var numFoods = (this.data.noFoodEntries)? 0 : GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood.length;

    response.creatures = this.creatureInput.getValue();
    if (!response.creatures && !dontAbort) return false;

    response.food = [];
    for (var i = 0; i < this.foodInputs.length; i++) {
        var answer = this.foodInputs[i].getValue();
        if (answer) response.food.push(answer);
        else if (i < numFoods && !dontAbort) return false;
        else response.food.push(0);
    }

    response.totalFood = this.totalFoodInput.getValue();
    if (!response.totalFood && this.totalFoodInput.visible && !dontAbort) return false;

    return response;
};

GlassLab.OrderFulfillment.prototype.show = function(data)
{
    this.sprite.visible = true;

    this.creatureInput.reset();
    this.totalFoodInput.reset();
    for (var i = 0; i < this.foodInputs.length; i++) {
        this.foodInputs[i].reset();
    }

    this.submitButton.setReadyToShip(false);

    this.data = data;
    if (!this.data.creatureType) this.data.creatureType = this.data.type; // fixing some inconsistency
    this.Refresh();

    this.crateLoaded = false;
    GLOBAL.assistant.startOrder(data);

    this._sendTelemetry("start_order");
    GlassLab.SignalManager.orderStarted.dispatch(this.data);

    GLOBAL.inventoryMenu.show(true); // show this after sending the event so that we don't have to refresh the inventory again
};

GlassLab.OrderFulfillment.prototype.hide = function()
{
    for (var i = 0; i < this.foodInputs.length; i++) {
        this.foodInputs[i].answerInput.SetFocus(false);
    }
    this.sprite.visible = false;

    if (this.crate)
    {
        this.crate.reset();
        this.crate.hide();
        // if we started shipping but didn't finish, be sure to remove the event listener
        this.crate.onShipped.remove(this._crateShipped, this);
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

    this.showTooltip = this.data.showTooltip;

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood;
    if (this.data.totalNumFood || this.data.askTotalFood) {
        if (this.data.noFoodEntries) {  // we can use the shorter bg and move things down
            if (this.bg.key != "orderBg") this.bg.loadTexture("orderBg");
        } else {
            if (this.bg.key != "orderBg2") this.bg.loadTexture("orderBg2");
        }
        this.totalFoodInput.visible = true;
        this.totalFoodInput.currentType = this.data.creatureType;
        this.totalFoodInput.trySetValue(this.data.totalNumFood);
    } else {
        if (this.bg.key != "orderBg") this.bg.loadTexture("orderBg");
        this.totalFoodInput.visible = false;
    }
    this.answerInputRoot.y = -this.bg.height + 50;

    // Set the values on the answer inputs. (If the values are unknown, it will be open for the player to enter.)
    this.creatureInput.currentType = this.data.creatureType;
    this.creatureInput.trySetValue(this.data.numCreatures);

    this._refreshfoodInputs();

    if (this.foodInputs[0].visible) {
        this.foodInputs[0].currentType = (this.data.numFoodA || this.data.noFoodEntries)? desiredFood[0].type : null;
        this.foodInputs[0].trySetValue(this.data.numFoodA);
    }

    if (this.foodInputs[1].visible) {
        this.foodInputs[1].currentType = (this.data.numFoodB || this.data.noFoodEntries) ? desiredFood[1].type : null;
        this.foodInputs[1].trySetValue(this.data.numFoodB);
    }

    this._refreshPen();

    // After a short delay, auto-focus one of the empty slots if we can
    this.game.time.events.add(1000, function() {
        if (this.creatureInput.canEnterValue) this.creatureInput.answerInput.SetFocus(true);
        else if (this.totalFoodInput.canEnterValue) this.totalFoodInput.answerInput.SetFocus(true);
    }, this);

    // refresh the submit button
    this.submitButton.setEnabled( this._getResponse() );
};

GlassLab.OrderFulfillment.prototype._refreshfoodInputs = function() {

    var maxFoods = (this.data.noFoodEntries)? 0 : GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood.length;
    for (var i = 0; i < this.foodInputs.length; i++) {
        var input = this.foodInputs[i];
        var hidden = i >= maxFoods; // we can't go above maxFoods
        input.refresh(hidden);
    }
    this.answerInputRoot._refresh();
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    //console.log("onSubmit", this.crateLoaded);
    if (!this.crateLoaded) { // need to load the crate for the first time
        var response = this._getResponse();
        if (response) {
            this._refreshPen(response);
            this.submitButton.setEnabled(false);
            this.creatureInput.setEnabled(false);
            this.totalFoodInput.setEnabled(false);
            for (var i = 0; i < this.foodInputs.length; i++) {
                var answerInput = this.foodInputs[i];
                answerInput.setEnabled(false);
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

        this.submitButton.setReadyToShip(true);
        this.submitButton.setEnabled(false);
        this.submitButton.anim.animations.paused = false; // in this special case, keep playing the anim even though the rest is disabled
    }
    else
    {
        console.error("No response for crate ship");
    }
};

GlassLab.OrderFulfillment.prototype._crateShipped = function() {
    var resultInfo = this.crate.calculateResult(this._calculateTargetNumCreatures(), this.data.totalNumFood);
    this.data.outcome = resultInfo.result;
    this.data.outcomeDetail = resultInfo.problems;

    // this is kinda messy but we need all this info for the receipt on the response letter
    this.data.shipped = { numCreatures: this.crate.numCreatures, numFoodA: this.crate.numFoods[0], numFoodB: this.crate.numFoods[1] || 0,
        foodTypeA: this.crate.foodTypes[0], foodTypeB: this.crate.foodTypes[1] };
    console.log(this.data.shipped);

    var response = this._getResponse();
    // if the answer was otherwise right, but they had to provide the total food AND the food entries, check that they match
    if (this.data.outcome == GlassLab.results.satisfied && this.data.askTotalFood && !this.data.noFoodEntries) {
        if (response.food[0] + response.food[1] != response.totalFood) {
            this.data.outcome = GlassLab.results.wrongTotalFood;
            this.data.outcomeDetail = response.totalFood;
        }
    }

    console.log("Crate shipped! Outcome:",this.data.outcome, "Problem:",this.data.outcomeDetail);

    GLOBAL.mailManager.completeOrder(this.data, this.data.outcome);
};


// From the assistant's dialogue
GlassLab.OrderFulfillment.prototype.restartLoading = function(numAttempts)
{
    this.submitButton.setReadyToShip(false);
    this.submitButton.setEnabled(true);
    this.crateLoaded = false;

    this.creatureInput.setEnabled(true);
    this.totalFoodInput.setEnabled(true);
    for (var i = 0; i < this.foodInputs.length; i++) {
        var answerInput = this.foodInputs[i];
        answerInput.setEnabled(true);
    }
    
    this._refreshPen();
    GlassLabSDK.saveTelemEvent("retry_order", {retry_count: numAttempts});
};

GlassLab.OrderFulfillment.prototype._onFoodSet = function(index, food) {
    this._refreshfoodInputs();
    this._onTextChange();
};

GlassLab.OrderFulfillment.prototype._sendTelemetry = function(eventName, calculateSuccess, result) {
    // Telemetry
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType);
    var response = this._getResponse(true);
    console.log("Sending telemetry with response",response);
    var foodTypes = [this.foodInputs[0].currentType, this.foodInputs[1].currentType];

    // figure out the correct answer
    var targetNumCreatures = this._calculateTargetNumCreatures();

    var data = {
        order_id: this.data.id || "",
        key: this.data.key || false,
        creature_type: this.data.creatureType,
        creature_count: response.creatures || 0,
        target_creature_count: targetNumCreatures,
        foodA_type: foodTypes[0] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type || "",
        foodB_type: foodTypes[1] || "",
        target_foodB_type: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].type : ""),
        foodA_count: (response.food && response.food[0]) || 0, // TODO: we want to get the provided food here
        target_foodA_count: creatureInfo.desiredFood[0].amount * targetNumCreatures,
        foodB_count: (response.food && response.food[1]) || 0,
        target_foodB_count: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].amount : 0) * targetNumCreatures,
        total_food: response.totalFood || 0,
        target_total_food: this.data.totalNumFood || 0
    };
    if (!data.target_total_food && this.data.askTotalFood) { // we need to calculate the total food they're meant to enter
        data.target_total_food = data.target_foodA_count + data.target_foodB_count;
    }
    if (this.data.noFoodEntries) {
        data.target_foodA_count = data.target_foodB_count = 0;
        data.target_foodA_type = data.target_foodB_type = "";
    }

    if (calculateSuccess) {
        if (!result && this.crate) result = this.crate.calculateResult(targetNumCreatures, this.data.totalNumFood).result;
        // one special case where they mismatched the entered total food and the sum of the food they entered
        if (result == GlassLab.results.satisfied && this.data.askTotalFood && !this.data.noFoodEntries) {
            if (response.food[0] + response.food[1] != response.totalFood) {
                result = GlassLab.results.wrongTotalFood;
            }
        }
        data.result = result || GlassLab.results.invalid; // we don't expect not to have a result, but just in case it happens use invalid
        data.success = result == GlassLab.results.satisfied;
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


/**
 * OrderFulfillmentButton - it has specific mouse over behavior and changes between Load Crate and Ship Crate
 */
GlassLab.OrderFulfillmentButton = function(game, x, y, callback, callbackContext) {
    GlassLab.UITextButton.prototype.constructor.call(this, game, x, y, "orderButton", "", {font: "11pt AmericanTypewriter", fill: "#fff"}, callback, callbackContext);

    this.label.position.setTo(-103, -50);

    this.anim = this.addChild(this.game.make.sprite(-173, -60, "orderButtonAnim"));
    this.anim.anchor.setTo(0.5, 0.5);
    this.anim.animations.add("load", Phaser.Animation.generateFrameNames("load_button_animation_",0,15,".png",3), 24, true);
    this.anim.animations.add("ship", Phaser.Animation.generateFrameNames("ship_button_animation_",90,137,".png",3), 24, true);

    this.setReadyToShip(false);
};

GlassLab.OrderFulfillmentButton.prototype = Object.create(GlassLab.UITextButton.prototype);
GlassLab.OrderFulfillmentButton.prototype.constructor = GlassLab.OrderFulfillmentButton;

GlassLab.OrderFulfillmentButton.prototype.setReadyToShip = function(ship) {
    GlassLab.Util.SetCenteredText(this.label, (ship)? "Shipping..." : "Load Crate" );
    this.anim.play((ship)? "ship" : "load");
    this.readyToShip = ship;

    this.refresh();
};

GlassLab.OrderFulfillmentButton.prototype.whenUp = function() {
    this.whenEnabled();
    this.tint = (this.readyToShip)? 0x3b6a9a : 0x994c4e;
};

GlassLab.OrderFulfillmentButton.prototype.whenOver = function() {
    this.whenEnabled();
    this.tint = (this.readyToShip)? 0x5395d9 : 0xd96b6f;
};

GlassLab.OrderFulfillmentButton.prototype.whenDown = function() {
    this.whenEnabled();
    this.tint = (this.readyToShip)? 0x223d59 : 0x592c2d;
};

GlassLab.OrderFulfillmentButton.prototype.whenDisabled = function() {
    this.tint = (this.readyToShip)? 0x3b6a9a : 0x994c4e;
    this.label.alpha = 0.25;
    this.anim.alpha = 0.25;
    this.anim.animations.paused = true;
    this.anim.frame = (this.readyToShip)? 52 : 14;
};

// useful function that undoes the stuff set by disabled
GlassLab.OrderFulfillmentButton.prototype.whenEnabled = function() {
    this.label.alpha = 1;
    this.anim.alpha = 1;
    this.anim.animations.paused = false;
};