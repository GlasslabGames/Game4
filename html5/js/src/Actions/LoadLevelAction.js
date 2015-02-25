/**
 * Created by Jerry Fu on 2/24/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LoadLevelAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
    this.levelData = {};
    this.level = -1;
};

GlassLab.LoadLevelAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.LoadLevelAction.prototype.constructor = GlassLab.LoadLevelAction;

GlassLab.LoadLevelAction.prototype.Do = function()
{
    if (this.level != -1)
    {
        GLOBAL.levelManager.LoadLevel(this.level);
    }
    else
    {
        GLOBAL.levelManager.LoadLevelFromData(this.levelData);
    }

    this._complete();
};