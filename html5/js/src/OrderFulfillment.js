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

    this.answerInputs = []; // array of answer inputs (for each kind of food)

    for (var i = 0; i < 2; i++) { // for now, assume that we don't have creatures that eat more than 2 kinds of food
        var rowY = 100 + 80 * i;
        var answerInput = new GlassLab.UITextInput(game, GlassLab.UITextInput.InputType.NUMERIC);
        answerInput.x = 50;
        answerInput.y = rowY;
        answerInput.SetInputLimit(2);
        this.sprite.addChild(answerInput);

        var inputErrorGraphic = this.game.make.graphics();
        answerInput.events.onTextChange.add(this._onTextChange, this);
        var answerInputBounds = answerInput.getLocalBounds();
        inputErrorGraphic.beginFill(0xFF4444).drawRect(-20,-20,answerInputBounds.width+60, answerInputBounds.height+40);
        inputErrorGraphic.alpha = 0;
        answerInput.addChild(inputErrorGraphic);

        var xLabel = game.make.text(120, rowY, "x");
        this.sprite.addChild(xLabel);

        var foodSprite = game.make.sprite(180, rowY + 30, "carrot");
        foodSprite.anchor.setTo(.5, .5);
        foodSprite.scale.setTo(.4, .4);
        this.sprite.addChild(foodSprite);

        this.answerInputs.push({ input: answerInput, errorGraphic: inputErrorGraphic,
            foodSprite: foodSprite, xLabel: xLabel});
    }

/*
    this.dragBox = game.make.sprite();
    var dragBoxGraphic = game.make.graphics();
    dragBoxGraphic.beginFill(0xffaaaa).drawRect(0,0,170,100);
    this.dragBox.addChild(dragBoxGraphic);
    this.sprite.addChild(this.dragBox);
    this.dragBox.x = 50;
    this.dragBox.y = 170;
*/
    this.submitButton = new GlassLab.UIButton(game, 30, 280, this._onSubmit, this, 180, 80 ,0xffaaff, "Ship Crate!");
    this.sprite.addChild(this.submitButton);

    this.orderRequirementLabel = game.make.text(0,0,"");
    this.orderRequirementLabel.anchor.setTo(1.0, 0);
    this.orderRequirementLabel.x = 800;
    this.sprite.addChild(this.orderRequirementLabel);

    this.cancelButton = game.make.button(830, 0, "cancelButton", function(){
        this.Hide(true);
    }, this);
    this.sprite.addChild(this.cancelButton);

    this.sprite.visible = false;
};

// When text is UITextInput is changed
GlassLab.OrderFulfillment.prototype._onTextChange = function(text)
{
    this._refreshPen();
};

GlassLab.OrderFulfillment.prototype._refreshPen = function() {
    var response = this._getResponse();

    if (response) {
        if (!this.pen)
        {
            // Make a pen with the correct number of sections for the number of food types we have
            var widths = [1];
            for (var j = 0; j < this.numFoodTypes; j++) widths.push(1);
            this.pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, null, 1, widths);
            this.pen.allowFeedButton = false;
        }
        this.pen.SetContents(this.data.type, this.data.numCreatures, response);
    }
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

GlassLab.OrderFulfillment.prototype.Show = function(data)
{
    this.sprite.visible = true;
    for (var i = 0; i < this.answerInputs.length; i++) {
        this.answerInputs[i].input.SetText("");
    }
    if (data)
    {
        this.data = data;
        this.Refresh();
    }
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
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{
    if (!this.data)
    {
        console.error("No data to refresh with!");
        return;
    }

    var desiredFood = GLOBAL.creatureManager.GetCreatureData(this.data.type).desiredFood;

    if (desiredFood.length != this.numFoodTypes && this.pen) { // destroy the pen so we can make a new one with the right # of sections
        this.pen.sprite.destroy();
        this.pen = null;
    }
    this.numFoodTypes = desiredFood.length;

    for (var i = 0; i < this.answerInputs.length; i++) {
        var visible = i < this.numFoodTypes;
        // Hide or show all the parts of the answer input
        for (var key in this.answerInputs[i]) {
            this.answerInputs[i][key].visible = visible;
        }
        // Set the correct sprite
        if (visible) {
            this.answerInputs[i].foodSprite.loadTexture(GlassLab.FoodTypes[desiredFood[i].type].spriteName);
        }
    }
    // num creatures
    this.orderRequirementLabel.setText("Order Requirements: " + this.data.numCreatures + " " + this.data.type);
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    var response = this._getResponse(true);

    if (response) {
        this.pen.FeedCreatures();
        this.Hide();
    }
};