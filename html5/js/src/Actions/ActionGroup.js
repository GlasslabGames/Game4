/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.ActionGroup = function(serializedActions)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.serializedActions = serializedActions; // serialized condition
    this.currentAction = null;
    this.currentActionIndex = 0;
    this._deserializedActions = [];

    this.waitForComplete = true;
};

GlassLab.ActionGroup.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ActionGroup.prototype.constructor = GlassLab.ActionGroup;

GlassLab.ActionGroup.prototype.Do = function()
{
    if (this.waitForComplete && this.currentActionIndex == this.serializedActions.length)
    {
        this._complete();
        return;
    }

    this.currentAction = GlassLab.Deserializer.deserializeObj(this.serializedActions[this.currentActionIndex]);
    this._deserializedActions[this.currentActionIndex] = this.currentAction;
    this.currentActionIndex++;

    this.currentAction.onComplete.addOnce(this._onActionComplete, this);
    this.currentAction.Do();

    if (!this.waitForComplete)
    {
        this._complete();
    }
};

GlassLab.ActionGroup.prototype.Redo = function() {
    this.currentAction = null;
    this.currentActionIndex = 0;
    this._deserializedActions = [];
    this.Do();
};

GlassLab.ActionGroup.prototype._onDestroy = function()
{
    for (var i=this._deserializedActions.length-1; i >= 0; i--)
    {
        this._deserializedActions[i].Destroy();
    }

    this._deserializedActions = null;

    this.currentAction = null;
};

GlassLab.ActionGroup.prototype._onActionComplete = function()
{
    this.Do();
};