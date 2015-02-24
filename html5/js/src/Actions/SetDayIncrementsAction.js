/**
 * Created by Jerry Fu on 2/20/2015.
 */
    
var GlassLab = GlassLab || {};

GlassLab.SetDayIncrementsAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.numDots = 0;
};

GlassLab.SetDayIncrementsAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.SetDayIncrementsAction.prototype.constructor = GlassLab.SetDayIncrementsAction;

GlassLab.SetDayIncrementsAction.prototype.Do = function()
{
    GLOBAL.dayManager.dayMeter.visible = true;
    var dotPositions = [];
    for (var i=0; i < this.numDots; i++)
    {
        dotPositions.push(i/this.numDots);
    }

    GLOBAL.dayManager.dayMeter.SetDots(dotPositions);
    this._complete();
};