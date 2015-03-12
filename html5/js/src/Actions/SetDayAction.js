/**
 * Created by Jerry Fu on 2/24/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.SetDayAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.numDots = 0;
};

GlassLab.SetDayAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.SetDayAction.prototype.constructor = GlassLab.SetDayAction;

GlassLab.SetDayAction.prototype.Do = function()
{
    GLOBAL.dayManager.dayMeter.SetDots(this.numDots);
    this._complete();
};