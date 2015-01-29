/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.OrdersMenu = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.journalLabel = game.make.text(400, 50, "Orders");
    this.journalLabel.anchor.setTo(.5, 0);
    this.sprite.addChild(this.journalLabel);

    this.data = {
        numCreatures: 7,
        type: 'rammus'
    };

    // PLACEHOLDER
    this.mock = game.make.sprite(250,0, "orderMock");
    this.mock.scale.setTo(.8,.8);
    this.sprite.addChild(this.mock);

    this.descriptionLabel = game.make.text(282, 250, "", {wordWrap: true, wordWrapWidth: 400});
    this.descriptionLabel.fontSize = 22;
    //this.sprite.addChild(this.descriptionLabel);

    this.selectButton = game.make.button(282, 438, "selectOrderButton", function(){
        this.Hide();

        GLOBAL.orderFulfillment.Show(this.data);
    }, this);
    this.sprite.addChild(this.selectButton);

    this.paymentLabel = game.make.text(445, 210, "$200");
    this.paymentLabel.fontSize = 22;
    //this.sprite.addChild(this.paymentLabel);

    this.closeButton = game.make.button(685, 17, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(.5, .5);
    this.closeButton.scale.setTo(.1, .1);
    this.sprite.addChild(this.closeButton);

    this.sprite.visible = false;
};

GlassLab.OrdersMenu.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.OrdersMenu.prototype.Refresh = function()
{
    this.descriptionLabel.setText(this.data.description);
};

GlassLab.OrdersMenu.prototype.SetInfo = function(data)
{
    this.data = data;
    this.Refresh();
}

GlassLab.OrdersMenu.prototype.Show = function()
{
    this.sprite.visible = true;

    this.SetInfo(
        {
            numCreatures: 7,
            type: "rammus",
            description: "Etiam nec leo eu felis porta ornare. Proin ultricies enim sit amet mauris pulvinar, nec bibendum augue 7 Rammus. Cum sociis natos que penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi eu arcu sit amet diam placerat porta vitae."
        });
};

GlassLab.OrdersMenu.prototype.Hide = function()
{
    this.sprite.visible = false;
};

GlassLab.OrdersMenu.prototype.ActivateOrder = function(orderID, showPopup)
{

};

GlassLab.OrdersMenu.prototype._onClosePressed = function()
{
    this.Hide();
};