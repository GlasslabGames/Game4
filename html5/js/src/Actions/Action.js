/**
 * Created by Jerry Fu on 2/9/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Action = function()
{
    this.completed = false;

    this.onComplete = new Phaser.Signal();
    console.log("OnComplete added to",this);
};

/**
 * OVERRIDE THIS, call _complete() when finished!
 * @protected
 */
GlassLab.Action.prototype.Do = function()
{
    console.error("Action.Do was not overridden, completing Action without doing anything");
    this._complete();
};

/**
 *
 * @protected
 */
GlassLab.Action.prototype._complete = function()
{
    this.completed = true;
    this.onComplete.dispatch(this);
};

/**
 * @public
 */
GlassLab.Action.prototype.Destroy = function()
{
    this._onDestroy();

    this.onComplete.dispose();
};

/**
 * OVERRIDE
 * @protected
 */
GlassLab.Action.prototype._onDestroy = function() {};