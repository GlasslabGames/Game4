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

    this.soundButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onSoundButton, this, 250, 60, 0xffffff, "Turn off sound effects");
    this.musicButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onMusicButton, this, 250, 60, 0xffffff, "Turn off music");

    this.modal = new GlassLab.UIModal(this.game, "Sound Settings", [this.soundButton, this.musicButton]);
    this.modal.table.setNumColumns(1);
    this.modal.resize();
    this.addChild(this.modal);

    this.closeButton = new GlassLab.UIButton(this.game, this.modal.getWidth() / 2, -this.modal.getHeight() / 2, "closeIcon", this.toggle, this);
    this.closeButton.anchor.setTo(0.5, 0.5);
    this.closeButton.scale.setTo(0.12, 0.12);
    this.addChild(this.closeButton);

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
    this.modal.Show();
    this._refreshButtons();
};

GlassLab.PauseMenu.prototype.hide = function()
{
    this.modal.Hide();
    this.visible = false;
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
        this.musicButton.label.text = "Turn off music";
    } else {
        this.musicButton.label.text = "Turn on music";
    }
    if (GLOBAL.audioManager.soundEffectsOn) {
        this.soundButton.label.text = "Turn off sound effects";
    } else {
        this.soundButton.label.text = "Turn on sound effects";
    }
};