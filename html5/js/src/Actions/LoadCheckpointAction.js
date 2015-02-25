/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LoadCheckpointAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

    this.saveName = "default_checkpoint";
};

GlassLab.LoadCheckpointAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.LoadCheckpointAction.prototype.constructor = GlassLab.LoadCheckpointAction;

GlassLab.LoadCheckpointAction.prototype.Do = function()
{
    GLOBAL.saveManager.Load(this.saveName);
    this._complete();
};