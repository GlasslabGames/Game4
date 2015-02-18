/**
 * Quest - This class just serves as a holder for a sequence of Conditionals and Actions
 *
 * Managed by QuestManager
 * Created by Jerry Fu on 2/10/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Quest = function(actions)
{
    /**
     * @readonly
     * @type {boolean}
     * @private
     */
    this._isStarted = false;

    this._isComplete = false;
    this.actions = actions;
    this._currentActionIndex = -1;
};

GlassLab.Quest.prototype.Start = function()
{
    if (!this._isStarted)
    {
        this._isStarted = true;
        this._procNextStep();
    }
};

Object.defineProperty(GlassLab.Quest.prototype, 'isStarted', {
    get: function() {
        return this._isStarted;
    }
});

GlassLab.Quest.prototype.Reset = function()
{
    this._isStarted = false;
    for (var i=0, j=this.actions.length; i < j; i++)
    {
        var action = this.actions[i];
        action.completed = false;
    }
    this._currentActionIndex = -1;
};

GlassLab.Quest.prototype._procNextStep = function()
{
    if (this.actions.length == 0)
    {
        console.error("No actions in Quest");
        return;
    }

    this._currentActionIndex++;

    if (this._currentActionIndex == this.actions.length)
    {
        this._complete();
        return;
    }

    this.currentAction = this.actions[this._currentActionIndex];

    if (this.currentAction.hasOwnProperty("__type"))
    {
        this.currentAction = GlassLab.Deserializer.deserializeObj(this.currentAction);
    }

    this.currentAction.onComplete.add(this._procNextStep, this);
    this.currentAction.Do();
};

GlassLab.Quest.prototype.ForceComplete = function()
{
    if (this.currentAction != null)
    {
        // Cancel action
        console.error("Forcing a quest to complete hasn't been fully implemented yet. You may see bugs...");
    }

    this._complete();
};

GlassLab.Quest.prototype._complete = function()
{
    this.currentAction = null;
    this._isComplete = true;
    this._isStarted = false;
};

