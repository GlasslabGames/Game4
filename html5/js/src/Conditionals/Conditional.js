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
GlassLab.Conditional.prototype._calculateIsSatisfied = function() { return false; };

/**
 * OVERRIDE THIS - cleanup upon completion
 * @protected
 */
GlassLab.Conditional.prototype._complete = function() {};

/**
 * OVERRIDE THIS - initialization function
 * @public
 */
GlassLab.Conditional.prototype.init = function() {};

/**
 * destructor
 * @public
 */
GlassLab.Conditional.prototype.Destroy = function()
{
    this._doDestroy();

    this.onSatisfiedChanged.dispose();
};

/**
 * OVERRIDE THIS - destructor
 * @protected
 */
GlassLab.Conditional.prototype._doDestroy = function() {};

/**
 * DO NOT OVERRIDE, instead override _calculateIsSatisfied and _complete!
 * @public
 */
GlassLab.Conditional.prototype.Refresh = function()
{
    var wasCompleted = this.isCompleted;
    this.isCompleted = this._calculateIsSatisfied();
    if (wasCompleted != this.isCompleted)
    {
        if (this.isCompleted)
        {
            this._complete();
        }

        this.onSatisfiedChanged.dispatch(this);
    }
};

Object.defineProperty(GlassLab.Conditional.prototype, 'isSatisfied', {
    get: function() {
        return this._isCompleted;
    }
});
