/**
 * Created by Jerry Fu on 2/24/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LoadLevelAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
    this.levelData = {};
};

GlassLab.LoadLevelAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.LoadLevelAction.prototype.constructor = GlassLab.LoadLevelAction;

GlassLab.LoadLevelAction.prototype.Do = function()
{
    GLOBAL.levelManager.LoadLevelFromData(this.levelData);
    this._complete();
};