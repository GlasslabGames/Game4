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
    var dotPositions = [];
    for (var i=0; i < this.numDots; i++)
    {
        dotPositions.push(i/Math.max(this.numDots-1, 1));
    }

    GLOBAL.dayManager.dayMeter.SetDots(dotPositions);
    this._complete();
};