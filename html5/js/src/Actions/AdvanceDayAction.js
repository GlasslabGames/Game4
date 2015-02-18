/**
 * Created by Jerry Fu on 2/10/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.AdvanceDayAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    if (!GLOBAL.advanceDayTextField)
    {
        GLOBAL.advanceDayTextField = GLOBAL.game.make.text(0,0, "");
        GLOBAL.advanceDayTextField.fixedToCamera = true;
        GLOBAL.game.world.add(GLOBAL.advanceDayTextField);
    }
};

GlassLab.AdvanceDayAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.AdvanceDayAction.prototype.constructor = GlassLab.AdvanceDayAction;

GlassLab.AdvanceDayAction.prototype.Do = function()
{
    GLOBAL.dayManager.Advance();
    this._complete();
};