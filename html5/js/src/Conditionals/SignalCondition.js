/**
 * Created by Jerry Fu on 2/13/2015.
 */
    
var GlassLab = GlassLab || {};

GlassLab.SignalCondition = function(signal)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.signal = signal;
    this.signalName = "";
};

GlassLab.SignalCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.SignalCondition.prototype.constructor = GlassLab.SignalCondition;

GlassLab.SignalCondition.prototype._calculateIsSatisfied = function()
{
    return this.signalReceived;
};

GlassLab.SignalCondition.prototype._onSignalReceived = function()
{
    this.signalReceived = true;
    this.Refresh();
};

GlassLab.SignalCondition.prototype.init = function()
{
    // Init from deserialization
    if (!this.signal && this.signalName)
    {
        this.signal = GlassLab.Deserializer.getClassFromTypeName(this.signalName);
    }
    this.signal.addOnce(this._onSignalReceived, this);
};