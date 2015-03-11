/**
 * Created by Rose Abernathy on 3/10/2015.
 */

GlassLab.AnimateButtonAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

};

GlassLab.AnimateButtonAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.AnimateButtonAction.prototype.constructor = GlassLab.AnimateButtonAction;

GlassLab.AnimateButtonAction.prototype.Do = function()
{
    var button = GLOBAL.UIManager[this.button];
    if (button) button.toggleActive(true);
    this._complete();
};