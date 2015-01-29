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

    this.answerInput = new GlassLab.UITextInput(game);
    this.answerInput.x = 50;
    this.answerInput.y = 100;
    this.answerInput.SetInputLimit(2);
    this.inputErrorGraphic = this.game.make.graphics();
    this.answerInput.addChild(this.inputErrorGraphic);
    var answerInputBounds = this.answerInput.getLocalBounds();
    this.inputErrorGraphic.beginFill(0xFF4444).drawRect(-20,-20,answerInputBounds.width+40, answerInputBounds.height+40);
    this.inputErrorGraphic.alpha = 0;
    this.sprite.addChild(this.answerInput);
    this.sprite.visible = false;

    this.xLabel = game.make.text(120, 100, "x");
    this.sprite.addChild(this.xLabel);

    this.foodSprite = game.make.sprite(180, 130, "carrot");
    this.foodSprite.anchor.setTo(.5, .5);
    this.foodSprite.scale.setTo(.4, .4);
    this.sprite.addChild(this.foodSprite);
/*
    this.dragBox = game.make.sprite();
    var dragBoxGraphic = game.make.graphics();
    dragBoxGraphic.beginFill(0xffaaaa).drawRect(0,0,170,100);
    this.dragBox.addChild(dragBoxGraphic);
    this.sprite.addChild(this.dragBox);
    this.dragBox.x = 50;
    this.dragBox.y = 170;
*/
    this.submitButton = game.make.button();
    var submitButtonGraphic = game.make.graphics();
    submitButtonGraphic.beginFill(0xffaaff).lineStyle(3, 0x000000, 1).drawRect(0,0,180,80);
    this.submitButton.addChild(submitButtonGraphic);
    this.sprite.addChild(this.submitButton);
    this.submitButton.x = 30;
    this.submitButton.y = 280;
    this.submitButton.inputEnabled = true;
    var submitLabel = game.make.text(0,0,"Ship Crate!");
    submitLabel.anchor.setTo(.5, .5);
    submitLabel.x = 90;
    submitLabel.y = 40;
    this.submitButton.addChild(submitLabel);
    this.submitButton.events.onInputDown.add(this._onSubmit, this);

    this.orderRequirementLabel = game.make.text(0,0,"");
    this.orderRequirementLabel.anchor.setTo(1.0, 0);
    this.orderRequirementLabel.x = 870;
    this.sprite.addChild(this.orderRequirementLabel);

    this.cancelButton = game.make.button(900, 0, "cancelButton", function(){
        this.Hide();
    }, this);
    this.sprite.addChild(this.cancelButton);
};


GlassLab.OrderFulfillment.prototype.Show = function(data)
{
    this.sprite.visible = true;
    if (data)
    {
        this.data = data;
        this.Refresh();
    }
};

GlassLab.OrderFulfillment.prototype.Hide = function()
{
    this.answerInput.SetFocus(false);
    this.sprite.visible = false;
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{
    if (!this.data)
    {
        console.error("No data to refresh with!");
        return;
    }

    // food type
    //this.foodSprite.setSprite

    // num creatures
    this.orderRequirementLabel.setText("Order Requirements: " + this.data.numCreatures + " " + this.data.type);

    // Type creatures
};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    var response = this.answerInput.GetText();

    console.log("Order response: "+response);

    if (!response)
    {
        this.inputErrorGraphic.alpha = 1;
        this.game.add.tween(this.inputErrorGraphic).to( {alpha: 0}, 500, "Linear", true);
        return;
    }

    var pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer);
    pen.SetContents(this.data.numCreatures, response);
    pen.FeedCreatures();

    this.Hide();
};