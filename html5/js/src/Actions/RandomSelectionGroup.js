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
};

GlassLab.RandomSelectionGroup.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.RandomSelectionGroup.prototype.constructor = GlassLab.RandomSelectionGroup;

GlassLab.RandomSelectionGroup.prototype.Do = function(redo, withConstraints)
{
    if (!redo || this.index < 0) this.index = Math.floor(Math.random() * this.possibilities.length);
    // if redo is true (and we've chosen an index already), we don't want to choose the random index again.

    this.action = GlassLab.Deserializer.deserializeObj(this.possibilities[this.index]);

    this.action.onComplete.addOnce(this._onActionComplete, this);
    this.action.Do(redo, withConstraints);

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