/**
 * Created by Jerry Fu on 2/10/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DisplayModalAction = function(game, text)
{
    GlassLab.Action.prototype.constructor.call(this);
    this.game = game || GLOBAL.game;
    this.text = text;
};

GlassLab.DisplayModalAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DisplayModalAction.prototype.constructor = GlassLab.DisplayModalAction;

GlassLab.DisplayModalAction.prototype.Do = function()
{
    this.button = new GlassLab.UIRectButton(this.game, 0, 0, this._onButtonPressed, this, 150, 60, 0xffffff, "Ok");
    this.modal = new GlassLab.UIModal(this.game, this.text, [this.button]);
    this.modal.show();
    GLOBAL.UIManager.centerAnchor.addChild(this.modal);
};

GlassLab.DisplayModalAction.prototype._onButtonPressed = function()
{
    this.modal.destroy(true);
    this.modal = null;
    this._complete();
};