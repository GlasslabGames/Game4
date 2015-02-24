/**
 * Created by Jerry Fu on 2/20/2015.
 */
    
var GlassLab = GlassLab || {};

GlassLab.SetDayIncrementsAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.SetDayIncrementsAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.SetDayIncrementsAction.prototype.constructor = GlassLab.SetDayIncrementsAction;

GlassLab.SetDayIncrementsAction.prototype.Do = function()
{
    GLOBAL.dayManager.dayMeter.SetDots([0, .33, .66, 1]);
    this._complete();
};