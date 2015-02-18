/**
 * Created by Jerry Fu on 2/17/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.SaveManager = function(game)
{
    this.game = game;
    this.dataBlob = JSON.parse(document.cookie || "{}");

    if (getParameterByName("reset") == "true")
    {
        this.dataBlob = {};
    }

    this.saveRequested = false;
    this.lastSaveTime = -1;
};

GlassLab.SaveManager.SAVE_DELAY = 5; // Minimum time in seconds to wait between saves.

GlassLab.SaveManager.prototype.SaveData = function(key, value)
{
    this.dataBlob[key] = value;
    this.onDataChanged();

    GlassLab.SignalManager.update.add(this._onUpdate, this);
};

GlassLab.SaveManager.prototype.LoadData = function(key)
{
    return this.dataBlob[key];
};

GlassLab.SaveManager.prototype.onDataChanged = function()
{
    if (this.game.time.totalElapsedSeconds() - this.lastSaveTime > GlassLab.SaveManager.SAVE_DELAY)
    {
        this._doSave();
    }
    else
    {
        this.saveRequested = true;
    }
};

GlassLab.SaveManager.prototype._onUpdate = function()
{
    if (this.saveRequested && this.game.time.totalElapsedSeconds() - this.lastSaveTime > GlassLab.SaveManager.SAVE_DELAY)
    {
        this._doSave();
    }
};

GlassLab.SaveManager.prototype._doSave = function()
{
    this.lastSaveTime = GLOBAL.game.time.totalElapsedSeconds();
    this.saveRequested = false;

    document.cookie = JSON.stringify(this.dataBlob);
    console.log("Saved. " + document.cookie);
};