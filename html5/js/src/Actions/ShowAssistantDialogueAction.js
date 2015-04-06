/**
 * Created by Rose Abernathy on 2/25/2015.
 */

GlassLab.ShowAssistantDialogueAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

};

GlassLab.ShowAssistantDialogueAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ShowAssistantDialogueAction.prototype.constructor = GlassLab.ShowAssistantDialogueAction;

GlassLab.ShowAssistantDialogueAction.prototype.Do = function()
{
    GLOBAL.assistant.showTutorial(this.text, this.showButton);
    this._complete();
};

GlassLab.HideAssistantDialogueAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

};

GlassLab.HideAssistantDialogueAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.HideAssistantDialogueAction.prototype.constructor = GlassLab.HideAssistantDialogueAction;

GlassLab.HideAssistantDialogueAction.prototype.Do = function()
{
    GLOBAL.assistant.hideTutorial();
    this._complete();
};