/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.RandomSelectionGroup = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.serializedActions = [];
    this.waitForComplete = true;
};

GlassLab.RandomSelectionGroup.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.RandomSelectionGroup.prototype.constructor = GlassLab.RandomSelectionGroup;

GlassLab.RandomSelectionGroup.prototype.Do = function()
{
    var index = Math.floor(Math.random() * this.serializedActions.length);
    this.action = GlassLab.Deserializer.deserializeObj(this.serializedActions[index]);

    this.action.onComplete.addOnce(this._onActionComplete, this);
    this.action.Do();

    if (!this.waitForComplete)
    {
        this._complete();
    }
};

GlassLab.RandomSelectionGroup.prototype._onDestroy = function()
{
    if (this.action) this.action.Destroy();
    this.action = null;
};

GlassLab.RandomSelectionGroup.prototype._onActionComplete = function()
{
    this._complete();
};