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

    this.menuLabel = this.game.make.text(0,-this.bg.height/2+10,"PAUSED", {font: "30pt EnzoBlack", fill: "#FFFFFF"});
    this.menuLabel.anchor.x = .5;
    this.addChild(this.menuLabel);

    this.resumeButton = new GlassLab.HUDButton(this.game, 0, -110, null, "pauseMenuButton", "RESUME GAME", {font: "14pt EnzoBlack"}, true, this.toggle, this);
    this.resumeButton.addOutline("pauseMenuButtonOutline");
    this.addChild(this.resumeButton);

    this.musicButton = new GlassLab.HUDButton(this.game, 0, 25, "pauseMenuMusicIcon", "pauseMenuButton", "TURN MUSIC OFF", {font: "14pt EnzoBlack"}, true, this._onMusicButton, this);
    this.musicButton.addOutline("pauseMenuButtonOutline");
    this.addChild(this.musicButton);

    this.soundButton = new GlassLab.HUDButton(this.game, 0, 95, "pauseMenuSFXIcon", "pauseMenuButton", "TURN SFX OFF", {font: "14pt EnzoBlack"}, true, this._onSoundButton, this);
    this.soundButton.addOutline("pauseMenuButtonOutline");
    this.addChild(this.soundButton);

    this.restartButton = new GlassLab.HUDButton(this.game, 0, 165, null, "pauseMenuButton", "RESTART GAME", {font: "14pt EnzoBlack"}, true, function()
    {
        this._showRestartConfirmation();
    }, this);
    this.restartButton.addOutline("pauseMenuButtonOutline");
    this.addChild(this.restartButton);

    this.confirmRestartButton = new GlassLab.HUDButton(this.game, 0, 45, null, "pauseMenuButton", "#YOLO - DO IT!", {font: "14pt EnzoBlack"}, true, function()
    {
        this._hideRestartConfirmation();
        this.hide();

        GLOBAL.saveManager.EraseSave();
        if (GLOBAL.questManager.GetCurrentQuest()) GLOBAL.questManager.GetCurrentQuest().Cancel(); // cancel the current quest
        
        GLOBAL.inventoryMenu.hide();
        GLOBAL.UIManager.hideAllWindows();
        GLOBAL.assistant.forceClose();
        GLOBAL.UIManager.journalButton.toggleActive(false);
        GLOBAL.UIManager.mailButton.toggleActive(false);

        GLOBAL.levelManager.LoadLevel(0);
        GLOBAL.transition.out();

    }, this);
    this.confirmRestartButton.addOutline("pauseMenuButtonOutline");
    this.addChild(this.confirmRestartButton);

    this.cancelRestartButton = new GlassLab.HUDButton(this.game, 0, 140, null, "bigButton", "NEVERMIND, GO BACK!", {font: "14pt EnzoBlack"}, true, function()
    {
        this._hideRestartConfirmation();
    }, this);
    this.cancelRestartButton.addOutline("bigButtonOutline");
    this.addChild(this.cancelRestartButton);

    this.restartWarningLabel = this.game.make.text(0,this.menuLabel.y + this.menuLabel.height+10,"Do you really want to start over?\nYou'll lose your current progress!", {font: "14pt EnzoBlack", fill: "#cccccc", align:"center"});
    this.restartWarningLabel.anchor.x = .5;
    this.addChild(this.restartWarningLabel);

    this.menuItems = [this.resumeButton, this.musicButton, this.soundButton, this.restartButton];
    this.restartMenuItems = [this.cancelRestartButton, this.confirmRestartButton, this.restartWarningLabel];

    this._hideRestartConfirmation();

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

GlassLab.PauseMenu.prototype._showRestartConfirmation = function()
{
    this.menuLabel.setText("RESTART?");
    for (var i=this.menuItems.length-1; i>=0; i--)
    {
        this.menuItems[i].visible = false;
    }
    for (var i=this.restartMenuItems.length-1; i>=0; i--)
    {
        this.restartMenuItems[i].visible = true;
    }
};

GlassLab.PauseMenu.prototype._hideRestartConfirmation = function()
{
    this.menuLabel.setText("PAUSED");
    for (var i=this.menuItems.length-1; i>=0; i--)
    {
        this.menuItems[i].visible = true;
    }
    for (var i=this.restartMenuItems.length-1; i>=0; i--)
    {
        this.restartMenuItems[i].visible = false;
    }
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