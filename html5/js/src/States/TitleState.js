
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
    button.input.priorityID = GLOBAL.UIpriorityID;
    this.title.addChild(button);
    this.playButton = button;
    button.input.customHoverCursor = "button";

    var creditsButton = new GlassLab.HUDButton(this.game, this.game.width / 2, this.game.height - 60, null, "creditsButtonBg",
        "CREDITS", {font: "12pt EnzoBlack"}, true, this._toggleCredits, this);
    creditsButton.anchor.setTo(0.5, 0);
    this.title.addChild(creditsButton);

    this.fade = this.game.make.graphics().beginFill(0,0.6).drawRect(0, 0, this.game.width, this.game.height);
    this.title.addChild(this.fade);
    this.fade.inputEnabled = true;
    this.fade.input.priorityID = GLOBAL.UIpriorityID - 1;
    this.fade.events.onInputUp.add(this._closeCredits, this);
    this.fade.alpha = 0;

    var cancelButton = new GlassLab.HUDButton(this.game, this.game.width - 40, 40, "cancelIcon", "hudSettingsBg", null, null, true, this._closeCredits, this);
    this.fade.addChild(cancelButton);

    var creditContainer = this.title.addChild(this.game.make.sprite(this.game.width / 2, this.game.height / 2));
    this.credits = new GlassLab.Credits(this.game);
    creditContainer.addChild(this.credits);
    //this.credits.show();

    GLOBAL.audioManager.toggleMusic(GlassLab.Util.HasCookieData("musicOn") ? GlassLab.Util.GetCookieData("musicOn") == 'true' : true, "bonus");
};

GlassLab.State.Title.prototype._onPlayButton = function() {
    this.title.destroy();
    GLOBAL.audioManager.playSound("clickSound");
    this.game.state.start("Game", false);
};

GlassLab.State.Title.prototype._closeCredits = function() {
    if (this.tween) this.tween.stop();
    this.tween = this.game.make.tween(this.fade).to({alpha: 0}, 100, Phaser.Easing.Quadratic.InOut, true);
    this.credits.hide();
    this.playButton.inputEnabled = true;
    this.playButton.input.priorityID = GLOBAL.UIpriorityID; // this gets reset if we turn off inputEnabled
};


GlassLab.State.Title.prototype._toggleCredits = function() {
    if (this.credits.visible) this._closeCredits();
    else this._openCredits();
};

GlassLab.State.Title.prototype._openCredits = function() {
    if (this.tween) this.tween.stop();
    this.tween = this.game.make.tween(this.fade).to({alpha: 1}, 100, Phaser.Easing.Quadratic.InOut, true);
    this.credits.show();
    this.playButton.inputEnabled = false; // disable while the journal is up
};


GlassLab.State.Title.prototype.update = function() {
    if (!GLOBAL.paused) GlassLab.SignalManager.update.dispatch(this.game.time.elapsedMS);
};