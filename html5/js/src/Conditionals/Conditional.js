/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Conditional = function()
{
    this.isCompleted = false;
    this.onSatisfiedChanged = new Phaser.Signal();
};

/**
 * OVERRIDE THIS
 * @protected
 */
GlassLab.Conditional.prototype._calculateIsSatisfied = function()
{
    return false;
};

GlassLab.Conditional.prototype.Refresh = function()
{
    var wasCompleted = this.isCompleted;
    this.isCompleted = this._calculateIsSatisfied();
    if (wasCompleted != this.isCompleted)
    {
        if (this.isCompleted)
        {
            this.onSatisfiedChanged.dispatch(this);
        }
    }
};
