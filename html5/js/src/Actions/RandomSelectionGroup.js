/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.RandomSelectionGroup = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.possibilities = [];
    this.waitForComplete = true;
    this.index = -1;

    this.deserializedActions = []; // keep deserialized actions instead of re-deserializing them
};

GlassLab.RandomSelectionGroup.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.RandomSelectionGroup.prototype.constructor = GlassLab.RandomSelectionGroup;

GlassLab.RandomSelectionGroup.prototype.Do = function(redo, withConstraints, failureCount)
{
    if (!redo || this.index < 0) this.index = Math.floor(Math.random() * this.possibilities.length);
    // if redo is true (and we've chosen an index already), we don't want to choose the random index again.

    this.action = this.deserializedActions[this.index];
    if (!this.action) {
        this.action = GlassLab.Deserializer.deserializeObj(this.possibilities[this.index]);
        this.deserializedActions[this.index] = this.action;
    }

    this.action.onComplete.addOnce(this._onActionComplete, this);
    this.action.Do(redo, withConstraints, failureCount);

    if (!this.waitForComplete)
    {
        this._complete();
    }
};

GlassLab.RandomSelectionGroup.prototype._onDestroy = function()
{
    for (var i = 0; i < this.deserializedActions.length; i++) {
        this.deserializedActions[i].Destroy();
    }
    this.deserializedActions = [];
    if (this.action) this.action.Destroy();
    this.action = null;
};

GlassLab.RandomSelectionGroup.prototype._onActionComplete = function()
{
    this._complete();
};