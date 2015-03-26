/**
 * Created by Jerry Fu on 2/17/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.SaveManager = function(game)
{
    this.game = game;
    this.dataBlob = {};

    // Try load from cookie
    if (getParameterByName("reset") != "true")
    {
        try {
            this.dataBlob = JSON.parse(document.cookie);
        }
        catch (e)
        {
            console.error("Error parsing cookie: "+e+"\n",document.cookie);
        }
    }

    this.saveRequested = false;
    this.lastSaveTime = -1;

    GlassLab.SignalManager.update.add(this._onUpdate, this);
};

GlassLab.SaveManager.SAVE_DELAY = 5; // Minimum time in seconds to wait between saves.

GlassLab.SaveManager.prototype.HasData = function(key)
{
    return this.dataBlob.hasOwnProperty(key);
};

GlassLab.SaveManager.prototype.Load = function(key)
{
    key = key || "default";
    GlassLab.SignalManager.gameLoaded.dispatch(this.dataBlob[key]);

    console.log("Game loaded: \n", this.dataBlob[key]);
};

GlassLab.SaveManager.prototype.Save = function(key, targetBlob)
{
    key = key || "default";
    targetBlob = targetBlob || {};
    GlassLab.SignalManager.saveRequested.dispatch(targetBlob);

    this.SaveData(key, targetBlob);
    return targetBlob;
};

GlassLab.SaveManager.prototype.SaveData = function(key, value)
{
    this.dataBlob[key] = value;
    this.onDataChanged();
};

GlassLab.SaveManager.prototype.LoadData = function(key)
{
    return this.dataBlob[key];
};

GlassLab.SaveManager.prototype.DeleteData = function(key)
{
    if (this.HasData(key))
    {
        delete this.dataBlob[key];
        return true;
    }
    else
    {
        return false;
    }
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
    console.log("Saved", this.dataBlob);
};

GlassLab.SaveManager.prototype.EraseSave = function()
{
    document.cookie = null;
};