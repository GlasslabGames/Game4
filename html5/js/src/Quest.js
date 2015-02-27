/**
 * Quest - This class just serves as a holder for a sequence of Conditionals and Actions
 *
 * Managed by QuestManager
 * Created by Jerry Fu on 2/10/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Quest = function(name, serializedActions)
{
    /**
     * @readonly
     * @type {boolean}
     * @private
     */
    this._isStarted = false;

    this.name = name;
    this._isComplete = false;
    this.actions = [];
    this.serializedActions = serializedActions;
    this._currentActionIndex = -1;

    GLOBAL.questManager.questsByName[this.name] = this;
};

GlassLab.Quest.prototype.Start = function()
{
    if (!this._isStarted)
    {
        this._isStarted = true;

        // Deserialize actions
        if (this.actions.length != 0)
        {
            // Destroy previous actions
            for (var i=this.actions.length-1; i>=0; i--)
            {
                this.actions[i].Destroy();
            }

            this.actions = [];
        }

        for (var i=this.serializedActions.length-1; i >= 0; i--)
        {
            this.actions[i] = GlassLab.Deserializer.deserializeObj(this.serializedActions[i]);
        }

        GlassLab.SignalManager.questStarted.dispatch(this);

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
    this.currentAction.onComplete.addOnce(this._procNextStep, this);
    this.currentAction.Do();
};

GlassLab.Quest.prototype.ForceComplete = function()
{
    if (this.currentAction != null)
    {
        // Cancel action?
        //console.error("Forcing a quest to complete hasn't been fully implemented yet. You may see bugs...");
    }

    this._complete();
};

GlassLab.Quest.prototype._complete = function()
{
    if (!this._isComplete)
    {
        this.currentAction = null;
        this._isComplete = true;
        this._isStarted = false;

        GlassLab.SignalManager.questEnded.dispatch(this);
    }
};

