
var GlassLab = GlassLab || {};
GlassLab.State = GlassLab.State || {};

GlassLab.State.Title = function(game) {};

GlassLab.State.Title.prototype.preload = function()
{

};
GlassLab.State.Title.prototype.create = function()
{
    this.title = this.game.add.sprite(0, 0, "titleBg");
    var button = this.game.make.button(this.game.width / 2, 460, "titleButton", this._onPlayButton, this, 2, 0, 1, 0);
    button.anchor.setTo(0.5, 0.5);
    this.title.addChild(button);

    var creditsButton = new GlassLab.HUDButton(this.game, this.game.width / 2, this.game.height - 60, null, "creditsButtonBg",
        "CREDITS", {font: "12pt EnzoBlack"}, true, this._onCreditsButton, this);
    creditsButton.anchor.setTo(0.5, 0);
    this.title.addChild(creditsButton);
};

GlassLab.State.Title.prototype._onPlayButton = function() {
    this.title.destroy();
    this.game.state.start("Game", false);
};

GlassLab.State.Title.prototype._onCreditsButton = function() {
    console.log("Credits!");
};