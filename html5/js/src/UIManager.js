/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;

    this.endLevelButton = this._createEndLevelButton();
    GLOBAL.UILayer.add(this.endLevelButton);
};

GlassLab.UIManager.prototype.ShowEndLevelButton = function()
{
    this.endLevelButton.visible = true;
};

GlassLab.UIManager.prototype.HideEndLevelButton = function()
{
    this.endLevelButton.visible = false;
};

GlassLab.UIManager.prototype.ShowEndLevelButton = function()
{
    this.endLevelButton.visible = true;
};

GlassLab.UIManager.prototype.HideEndLevelButton = function()
{
    this.endLevelButton.visible = false;
};

// TODO: Replace with class?
GlassLab.UIManager.prototype._createEndLevelButton = function()
{
    var endLevelButton = this.game.make.button(0,0,"closeIcon");
    endLevelButton.visible = false;
    endLevelButton.inputEnabled = true;
    endLevelButton.events.onInputDown.add(function(){
        this.visible = false;
        GLOBAL.levelManager.LoadNextLevel();
    }, this);

    GlassLab.SignalManager.journalClosed.add(function(){
        this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, endLevelButton);

    return endLevelButton;
};

GlassLab.UIManager.prototype._createZoomButton = function()
{

};