/**
 * Created by Jerry Fu on 2/19/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.SaveCheckpointAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.saveName = "default_checkpoint";
};

GlassLab.SaveCheckpointAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.SaveCheckpointAction.prototype.constructor = GlassLab.SaveCheckpointAction;

GlassLab.SaveCheckpointAction.prototype.Do = function()
{
    GLOBAL.saveManager.Save(this.saveName);
    this._complete();
};