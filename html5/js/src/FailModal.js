/**
 * Created by Jerry Fu on 1/21/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.FailModal = function(game) {
    this.sprite = game.make.sprite();

    this.background = game.make.graphics();
    this.background.beginFill(0xFFAAFF).drawRect(0, 0, 400, 200);
    this.sprite.addChild(this.background);

    this.retryButton = game.make.button(200, 100, "closeIcon" , this._onRetryPressed, this);
    this.retryButton.anchor.setTo(.5, .5);
    this.retryButton.scale.setTo(.5, .5);
    this.sprite.addChild(this.retryButton);

    this.retryText = game.make.text(200, 0, "FAILURE, retry?");
    this.retryText.anchor.setTo(.5, 0);
    this.sprite.addChild(this.retryText);

    this.sprite.visible = false;
};

GlassLab.FailModal.prototype.Show = function()
{
    this.sprite.visible = true;
};

GlassLab.FailModal.prototype.Hide = function()
{
    this.sprite.visible = false;
};

GlassLab.FailModal.prototype._onRetryPressed = function()
{
    this.Hide();
    alert("HAR HAR");
};