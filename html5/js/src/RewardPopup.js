/**
 * Created by Jerry Fu on 2/18/2015.
 */

var GlassLab = GlassLab || {};

/**
 * RewardPopup
 */

GlassLab.RewardPopup = function(game, x, y)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);//, null, callback, callbackContext);


};

GlassLab.RewardPopup.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.RewardPopup.prototype.constructor = GlassLab.RewardPopup;

GlassLab.RewardPopup.prototype.Show = function(data)
{
    this.visible = true;
};

GlassLab.RewardPopup.prototype.Hide = function()
{
    this.visible = false;
};