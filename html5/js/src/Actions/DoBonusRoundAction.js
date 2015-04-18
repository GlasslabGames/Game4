/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoBonusRoundAction = function(data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.completeListenerBinding = null;
    this.data = data;
};

GlassLab.DoBonusRoundAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DoBonusRoundAction.prototype.constructor = GlassLab.DoBonusRoundAction;

GlassLab.DoBonusRoundAction.prototype.Do = function()
{
    GlassLabSDK.endSessionAndFlush(function(data){
        console.log("Session ended: "+data);
    }.bind(this), function(data) {
        console.log("Session end failed: "+data);
    }.bind(this));
    GlassLabSDK.setOptions({gameLevel: GLOBAL.questManager.getBonusRoundId()});
    GlassLabSDK.startSession(function(data){
        console.log("Session started: "+data);
    }.bind(this), function(data) {
        console.log("Session start failed: "+data);
    }.bind(this));

    if (this.startImmediately) {
        GLOBAL.sortingGame.start(this.data);
    } else {
        GLOBAL.sortingGame.storedData = this.data;
        GLOBAL.UIManager.bonusModal.show(); // this will start the sorting game once they press a button
    }

    GLOBAL.questManager.UpdateObjective("Complete a bonus round!");

    this.completeListenerBinding = GlassLab.SignalManager.bonusGameComplete.addOnce(this._complete, this);
};

GlassLab.DoBonusRoundAction.prototype._onDestroy = function()
{
    if (this.completeListenerBinding)
    {
        GlassLab.SignalManager.bonusGameComplete.remove(this._complete, this);
    }
};