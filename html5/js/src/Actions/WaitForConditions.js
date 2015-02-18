/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.WaitForCondition = function(conditions)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.conditions = conditions;
};

GlassLab.WaitForCondition.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.WaitForCondition.prototype.constructor = GlassLab.WaitForCondition;

GlassLab.WaitForCondition.prototype.Do = function()
{
    for (var i=0, j=this.conditions.length; i < j; i++)
    {
        var condition = this.conditions[i];

        // Deserialize if serialized blob
        if (condition.hasOwnProperty("__type"))
        {
            this.conditions[i] = condition = GlassLab.Deserializer.deserializeObj(condition);
        }

        condition.onSatisfiedChanged.add(this._onConditionChanged, this);
        if (condition.init) condition.init();
    }
};

GlassLab.WaitForCondition.prototype._onConditionChanged = function(condition)
{
    for (var i=this.conditions.length-1; i >= 0; i--)
    {
        var condition = this.conditions[i];
        if (!condition.isCompleted)
        {
            return;
        }
    }

    // Should have exited early if any conditions were not met.
    this._complete();
};