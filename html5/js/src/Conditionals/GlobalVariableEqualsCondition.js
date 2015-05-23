/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.GlobalVariableEqualsCondition = function(variableName, compareTo)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.variableName = variableName;

    this.target = compareTo;
    this.targetVariable = null;

    this.updateSignalBinder = null;
};

GlassLab.GlobalVariableEqualsCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.GlobalVariableEqualsCondition.prototype.constructor = GlassLab.GlobalVariableEqualsCondition;

GlassLab.GlobalVariableEqualsCondition.prototype._calculateIsSatisfied = function()
{
    if (this.targetVariable) return GlassLab.Deserializer.getPropertyFromName(this.variableName) == GlassLab.Deserializer.getPropertyFromName(this.targetVariable);
    else return GlassLab.Deserializer.getPropertyFromName(this.variableName) == this.target;
};

GlassLab.GlobalVariableEqualsCondition.prototype._doDestroy = function()
{
    if (this.updateSignalBinder)
    {
        GlassLab.SignalManager.update.remove(this._update, this);
    }
};

GlassLab.GlobalVariableEqualsCondition.prototype._update = function(dt)
{
    this.Refresh();
};

GlassLab.GlobalVariableEqualsCondition.prototype.init = function()
{
    this.Refresh();

    if (!this.isCompleted)
    {
        this.updateSignalBinder = GlassLab.SignalManager.update.add(this._update, this);
    }
};