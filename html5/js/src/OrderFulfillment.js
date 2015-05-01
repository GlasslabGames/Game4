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
    var creatureWidth = this.data.creatureWidth || GLOBAL.creatureManager.getMinCreatureCols(this.data.creatureType) || 1;

    if (response) {
        // If noFoodEntries is true, we have to figure out what foodTypes and counts to use
        var foodTypes = [], foodCounts = [];
        if (this.data.noFoodEntries) {
            foodTypes.push(desiredFood[0].type, desiredFood[1].type); // get the food types this creature wants
            var total = desiredFood[0].amount + desiredFood[1].amount;
            var food1 = Math.round((desiredFood[0].amount / total) * response.totalFood);
            foodCounts.push( food1, response.totalFood - food1 );
        } else {
            foodTypes.push(this.foodInputs[0].currentType, this.foodInputs[1].currentType);
            foodCounts = response.food;
        }

        this.crate.setContents(this.data.creatureType, response.creatures, foodTypes, foodCounts, creatureWidth);
        this.focusCamera();
    } else if (this.data.hint) { // for a hint, show one row of food
        // if hint is true, we have two options
        // if numCreatures is provided, add one row of food.
        // else, show the pen with the correct dimensions of food

        var creatureMult; // determines how much food to show.
        if (this.data.numCreatures) { // when the number of creatures is provided, give them a hint of a single row of food
            creatureMult = creatureWidth;
        } else {
            creatureMult = this._calculateTargetNumCreatures(); // otherwise, give them enough food for all the creatures.
        }

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
    var response = {};
    // Figure out how many food entries we expect (0 if no food entries, 1 for baby creatures, 2 for adult creatures)
    var numFoods = (this.data.noFoodEntries)? 0 : GLOBAL.creatureManager.GetCreatureData(this.data.creatureType).desiredFood.length;

    response.creatures = this.creatureInput.getValue();
    if (!response.creatures) return false;

    response.food = [];
    for (var i = 0; i < this.foodInputs.length; i++) {
        var answer = this.foodInputs[i].getValue();
        if (answer) response.food.push(answer);
        else if (i < numFoods) return false;
    }

    response.totalFood = this.totalFoodInput.getValue();
    if (!response.totalFood && this.totalFoodInput.visible) return false;

    console.log(response);
    return response;
};

GlassLab.OrderFulfillment.prototype.show = function(data)
{
    this.sprite.visible = true;
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

GlassLab.OrderFulfillment.prototype.hide = function(destroyPen)
{
    for (var i = 0; i < this.foodInputs.length; i++) {
        this.foodInputs[i].answerInput.SetFocus(false);
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

    // calculate the correct food division so that we can show it in the pen later
/*    var total = desiredFood[0].amount + desiredFood[1].amount;
    this.data.numFoodA = (desiredFood[0].amount / total) * this.data.totalNumFood;
    this.data.numFoodB = (desiredFood[1].amount / total) * this.data.totalNumFood;*/

    this.foodInputs[0].currentType = (this.data.numFoodA || this.data.noFoodEntries)? desiredFood[0].type : null;
    this.foodInputs[0].trySetValue(this.data.numFoodA);

    this.foodInputs[1].currentType = (this.data.numFoodB || this.data.noFoodEntries)? desiredFood[1].type : null;
    this.foodInputs[1].trySetValue(this.data.numFoodB);

    this._refreshfoodInputs();

    this._refreshPen();

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
    console.log("onSubmit", this.crateLoaded);
    if (!this.crateLoaded) { // need to load the crate for the first time
        var response = this._getResponse();
        if (response) {
            this._refreshPen(response);
            this.submitButton.setEnabled(false);
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
    this.data.outcome = this.crate.result;
    this.data.outcomeDetail = this.crate.problemFoods;
    // this is kinda messy but we need all this info for the receipt on the response letter
    this.data.shipped = { numCreatures: this.crate.widths[0] * this.crate.height, numFoodA: this.crate.widths[1] * this.crate.height,
    numFoodB: this.crate.widths[2] * this.crate.height, foodTypeA: this.crate.foodTypes[0], foodTypeB: this.crate.foodTypes[1] };
    console.log(this.data.shipped);

    if (this.crate.result == GlassLab.results.satisfied && this.data.totalNumFood) { // we need to check that the number of creatures is correct
        var numCreatures = this._getResponse().creatures;
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
    this.submitButton.setReadyToShip(false);
    this.submitButton.setEnabled(true);
    this.crateLoaded = false;

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

GlassLab.OrderFulfillment.prototype._sendTelemetry = function(eventName, calculateSuccess) {
    // Telemetry
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.data.creatureType);
    var response = this._getResponse();
    var foodTypes = [this.foodInputs[0].currentType, this.foodInputs[1].currentType];

    // figure out the correct answer
    var targetNumCreatures = this._calculateTargetNumCreatures();

    var data = {
        order_id: this.data.id || "",
        key: this.data.key || false,
        creature_type: this.data.creatureType,
        creature_count: response[0] || 0,
        target_creature_count: targetNumCreatures,
        foodA_type: foodTypes[0] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type || "",
        foodB_type: foodTypes[1] || "",
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