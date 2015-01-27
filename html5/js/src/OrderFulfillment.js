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
    this.bg.beginFill(0xFFFFFF).drawRect(0,0,250,400);
    this.sprite.addChild(this.bg);

    this.packingLabel = game.make.text(30,30, "Packing List:");
    this.sprite.addChild(this.packingLabel);

    this.answerInput = new GlassLab.UITextInput(game);
    this.answerInput.x = 50;
    this.answerInput.y = 100;
    this.answerInput.SetInputLimit(2);
    this.sprite.addChild(this.answerInput);
    this.sprite.visible = false;

    this.xLabel = game.make.text(120, 100, "x");
    this.sprite.addChild(this.xLabel);

    this.foodSprite = game.make.sprite(180, 130, "food");
    this.foodSprite.anchor.setTo(.5, .5);
    this.foodSprite.scale.setTo(.4, .4);
    this.sprite.addChild(this.foodSprite);

    this.dragBox = game.make.sprite();
    var dragBoxGraphic = game.make.graphics();
    dragBoxGraphic.beginFill(0xffaaaa).drawRect(0,0,170,100);
    this.dragBox.addChild(dragBoxGraphic);
    this.sprite.addChild(this.dragBox);
    this.dragBox.x = 50;
    this.dragBox.y = 170;

    this.submitButton = game.make.button();
    var submitButtonGraphic = game.make.graphics();
    submitButtonGraphic.beginFill(0xffaaff).drawRect(0,0,170,80);
    this.submitButton.addChild(submitButtonGraphic);
    this.sprite.addChild(this.submitButton);
    this.submitButton.x = 50;
    this.submitButton.y = 280;
    this.submitButton.inputEnabled = true;
    this.submitButton.events.onInputDown.add(this._onSubmit, this);
};


GlassLab.OrderFulfillment.prototype.Show = function()
{
    this.sprite.visible = true;
};

GlassLab.OrderFulfillment.prototype.Hide = function()
{
    this.sprite.visible = false;
};

GlassLab.OrderFulfillment.prototype.SetData = function(data)
{
    this.data = data;

    this.Refresh();
};

GlassLab.OrderFulfillment.prototype.Refresh = function()
{

};

GlassLab.OrderFulfillment.prototype._onSubmit = function()
{
    console.log("Order response: "+this.answerInput.GetText());

    this.Hide();
};