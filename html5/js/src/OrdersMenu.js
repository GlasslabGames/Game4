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

    // PLACEHOLDER
    this.mock = game.make.sprite(250,0, "orderMock");
    this.mock.scale.setTo(.8,.8);
    this.sprite.addChild(this.mock);

    this.closeButton = game.make.button(700, 0, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(.5, .5);
    this.closeButton.scale.setTo(.1, .1);
    this.sprite.addChild(this.closeButton);

    this.sprite.visible = false;
};

GlassLab.OrdersMenu.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.OrdersMenu.prototype.Show = function()
{
    this.sprite.visible = true;
};

GlassLab.OrdersMenu.prototype.Hide = function()
{
    this.sprite.visible = false;
};

GlassLab.OrdersMenu.prototype._onClosePressed = function()
{
    this.Hide();
};