/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.ConditionalAction = function(serializedCondition, serializedTrueAction, serializedFalseAction)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.serializedCondition = serializedCondition; // serialized condition
    this.condition = null; // deserialized condition

    this.serializedTrueAction = serializedTrueAction;
    this.trueAction = null;
    this.serializedFalseAction = serializedFalseAction;
    this.falseAction = null;

    this.waitForComplete = true;
};

GlassLab.ConditionalAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ConditionalAction.prototype.constructor = GlassLab.ConditionalAction;

GlassLab.ConditionalAction.prototype.Do = function()
{
    // Deserialize if serialized blob
    if (!this.condition)
    {
        this.condition = GlassLab.Deserializer.deserializeObj(this.serializedCondition);
    }

    if (this.condition.init) this.condition.init();

    this.condition.Refresh();

    if (this.condition.isCompleted)
    {
        if (this.trueAction)
        {
            this._doAction(this.trueAction);
        }
        else if (this.serializedTrueAction)
        {
            this.trueAction = GlassLab.Deserializer.deserializeObj(this.serializedTrueAction);
            this._doAction(this.trueAction);
        }
        else
        {
            // No action, complete immediately
            this._complete();
        }
    }
    else
    {
        if (this.falseAction)
        {
            this._doAction(this.falseAction);
        }
        else if (this.serializedFalseAction)
        {
            this.falseAction = GlassLab.Deserializer.deserializeObj(this.serializedFalseAction);
            this._doAction(this.falseAction);
        }
        else
        {
            // No action, complete immediately
            this._complete();
        }
    }
};

GlassLab.ConditionalAction.prototype._doAction = function(action)
{
    if (this.waitForComplete)
    {
        action.onComplete.addOnce(this._onActionComplete, this);
    }

    action.Do();

    if (!this.waitForComplete)
    {
        this._complete();
    }
};

GlassLab.ConditionalAction.prototype._onActionComplete = function()
{
    this._complete();
};

GlassLab.ConditionalAction.prototype._onDestroy = function()
{
    if (this.falseAction)
    {
        this.falseAction.Destroy();
    }

    if (this.trueAction)
    {
        this.trueAction.Destroy();
    }

    if (this.condition)
    {
        this.condition.Destroy();
    }
};