/**
 * Created by Jerry Fu on 2/13/2015.
 */
    
var GlassLab = GlassLab || {};

GlassLab.SignalCondition = function(signal)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.signal = signal;
    this.signalName = "";

    this.signalBinding = null;
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

GlassLab.SignalCondition.prototype._doDestroy = function()
{
    if (this.signalBinding && this.signalBinding.signal)
    {
        this.signal.remove(this._onSignalReceived, this);
    }
};

GlassLab.SignalCondition.prototype.init = function()
{
    // Init from deserialization
    if (!this.signal && this.signalName)
    {
        this.signal = GlassLab.Deserializer.getClassFromTypeName("GlassLab.SignalManager." + this.signalName);
    }

    this.signalBinding = this.signal.addOnce(this._onSignalReceived, this);
};