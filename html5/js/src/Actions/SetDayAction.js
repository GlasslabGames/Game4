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
    if (this.numDots <= 1)
    {
        console.error("Could not set dots because numDots must be greater than 1. (numDots: "+this.numDots+")")
        this._complete();
        return;
    }
    var dotPositions = [];
    for (var i=0; i < this.numDots; i++)
    {
        dotPositions.push(i/(this.numDots-1));
    }

    GLOBAL.dayManager.dayMeter.SetDots(dotPositions);
    this._complete();
};