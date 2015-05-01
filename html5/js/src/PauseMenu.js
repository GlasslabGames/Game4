/**
 * Created by Rose Abernathy on 3/6/2015.
 */

var GlassLab = GlassLab || {};

/**
 * PauseMenu
 */

GlassLab.PauseMenu = function(game, x, y)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);

    this.bg = this.game.make.sprite(0,0,"pauseMenuBackground");
    this.bg.anchor.setTo(.5, .5);
    this.addChild(this.bg);

    this.resumeButton = new GlassLab.HUDButton(this.game, 0, -110, null, "pauseMenuButton", "RESUME GAME", {font: "14pt EnzoBlack"}, true, this.toggle, this);
    this.addChild(this.resumeButton);
    this.buttonHighlight = this.game.make.sprite(0,0,"pauseMenuButtonOutline");
    this.buttonHighlight.anchor.setTo(.5, .5);
    this.resumeButton.addChild(this.buttonHighlight);
    this.resumeButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.buttonHighlight);
    this.resumeButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.buttonHighlight);

    this.musicButton = new GlassLab.HUDButton(this.game, 0, 25, "pauseMenuMusicIcon", "pauseMenuButton", "TURN MUSIC OFF", {font: "14pt EnzoBlack"}, true, this._onMusicButton, this);
    this.addChild(this.musicButton);
    this.buttonHighlight = this.game.make.sprite(0,0,"pauseMenuButtonOutline");
    this.buttonHighlight.anchor.setTo(.5, .5);
    this.musicButton.addChild(this.buttonHighlight);
    this.musicButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.buttonHighlight);
    this.musicButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.buttonHighlight);

    this.soundButton = new GlassLab.HUDButton(this.game, 0, 95, "pauseMenuSFXIcon", "pauseMenuButton", "TURN SFX OFF", {font: "14pt EnzoBlack"}, true, this._onSoundButton, this);
    this.addChild(this.soundButton);
    this.buttonHighlight = this.game.make.sprite(0,0,"pauseMenuButtonOutline");
    this.buttonHighlight.anchor.setTo(.5, .5);
    this.soundButton.addChild(this.buttonHighlight);
    this.soundButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.buttonHighlight);
    this.soundButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.buttonHighlight);

    this.restartButton = new GlassLab.HUDButton(this.game, 0, 165, null, "pauseMenuButton", "RESTART GAME", {font: "14pt EnzoBlack"}, true, function()
    {
        this.restartModal.show();
    }, this);
    this.addChild(this.restartButton);
    this.buttonHighlight = this.game.make.sprite(0,0,"pauseMenuButtonOutline");
    this.buttonHighlight.anchor.setTo(.5, .5);
    this.restartButton.addChild(this.buttonHighlight);
    this.restartButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.buttonHighlight);
    this.restartButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.buttonHighlight);

    this.confirmRestartButton = new GlassLab.UIRectButton(this.game, 0, 0, function()
    {
        this.restartModal.hide();
        this.hide();
        GLOBAL.saveManager.EraseSave();
        GLOBAL.levelManager.LoadLevel(0);
    }, this, 250, 60, 0xffffff, "Erase Save");
    this.cancelRestartButton = new GlassLab.UIRectButton(this.game, 0, 0, function()
    {
        this.restartModal.hide();
    }, this, 250, 60, 0xffffff, "Cancel");

    this.restartModal = new GlassLab.UIModal(this.game, "Restarting cannot be undone!\nAre you sure?", [this.confirmRestartButton, this.cancelRestartButton]);
    this.restartModal.table.setNumColumns(2);
    this.restartModal.resize();
    this.addChild(this.restartModal);
    this.restartModal.hide();

    this.visible = false;
};

GlassLab.PauseMenu.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.PauseMenu.prototype.constructor = GlassLab.PauseMenu;

GlassLab.PauseMenu.prototype.toggle = function()
{
    if (this.visible) this.hide();
    else this.show();
};

GlassLab.PauseMenu.prototype.show = function()
{
    this.visible = true;
    this._refreshButtons();
    GlassLab.SignalManager.uiWindowOpened.dispatch(this);
};

GlassLab.PauseMenu.prototype.hide = function()
{
    this.visible = false;
    GlassLab.SignalManager.uiWindowClosed.dispatch(this);
};

GlassLab.PauseMenu.prototype._onSoundButton = function()
{
    GLOBAL.audioManager.toggleSoundEffects();
    this._refreshButtons();
};

GlassLab.PauseMenu.prototype._onMusicButton = function()
{
    GLOBAL.audioManager.toggleMusic();
    this._refreshButtons();
};

GlassLab.PauseMenu.prototype._refreshButtons = function()
{
    if (GLOBAL.audioManager.musicOn) {
        this.musicButton.label.text = "TURN MUSIC OFF";
    } else {
        this.musicButton.label.text = "TURN MUSIC ON";
    }
    if (GLOBAL.audioManager.soundEffectsOn) {
        this.soundButton.label.text = "TURN SFX OFF";
    } else {
        this.soundButton.label.text = "TURN SFX ON";
    }
};