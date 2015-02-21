/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.GlobalVariableGreaterThanCondition = function(variableName, amount)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.variableName = variableName;

    this.number = amount;

    this.updateSignalBinder = null;
};

GlassLab.GlobalVariableGreaterThanCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.GlobalVariableGreaterThanCondition.prototype.constructor = GlassLab.GlobalVariableGreaterThanCondition;

GlassLab.GlobalVariableGreaterThanCondition.prototype._calculateIsSatisfied = function()
{
    return GlassLab.Deserializer.getPropertyFromName(this.variableName) > this.number;
};

GlassLab.GlobalVariableGreaterThanCondition.prototype._doDestroy = function()
{
    if (this.updateSignalBinder)
    {
        GlassLab.SignalManager.update.remove(this._update, this);
    }
};

GlassLab.GlobalVariableGreaterThanCondition.prototype._update = function(dt)
{
    this.Refresh();
}

GlassLab.GlobalVariableGreaterThanCondition.prototype.init = function()
{
    this.Refresh();

    if (!this.isCompleted)
    {
        this.updateSignalBinder = GlassLab.SignalManager.update.add(this._update, this);
    }
};