/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.WaitForCondition = function(serializedConditions)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.conditions = serializedConditions; // serialized conditions
    this._deserializedConditions = []; // deserialized conditions
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
            condition = GlassLab.Deserializer.deserializeObj(condition);
            condition.onSatisfiedChanged.add(this._onConditionChanged, this);
        }

        this._deserializedConditions[i] = condition;

        if (condition.init) condition.init();
    }
};

GlassLab.WaitForCondition.prototype._onConditionChanged = function(condition)
{
    for (var i=this._deserializedConditions.length-1; i >= 0; i--)
    {
        var condition = this._deserializedConditions[i];
        if (!condition.isCompleted)
        {
            return;
        }
    }

    // Should have exited early if any conditions were not met.
    this._complete();
};

GlassLab.WaitForCondition.prototype._onDestroy = function()
{
    for (var i=0; i < this._deserializedConditions.length; i++)
    {
        var condition = this._deserializedConditions[i];
        condition.Destroy();
    }

    this._deserializedConditions = null;
};