/**
 * Created by Jerry Fu on 2/13/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.ClearWorldAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.ClearWorldAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ClearWorldAction.prototype.constructor = GlassLab.ClearWorldAction;

GlassLab.ClearWorldAction.prototype.Do = function()
{
    GLOBAL.levelManager._destroyCurrentLevel();

    this._complete();
};