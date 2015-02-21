/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.ResetTelemetryAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.ResetTelemetryAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ResetTelemetryAction.prototype.constructor = GlassLab.ResetTelemetryAction;

GlassLab.ResetTelemetryAction.prototype.Do = function()
{

    this._complete();
};