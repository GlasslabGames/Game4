/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;

    this.endLevelButton = this._createEndLevelButton();
    GLOBAL.UIGroup.add(this.endLevelButton);
    this.endLevelButton.fixedToCamera = true;
    this.endLevelButton.cameraOffset.setTo(game.camera.width/2, 50);
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
    var endLevelButton = this.game.make.button(0,0,"nextLevelButton");
    endLevelButton.anchor.setTo(.5,0);
    endLevelButton.visible = false;
    endLevelButton.inputEnabled = true;
    endLevelButton.input.priorityID = GLOBAL.UIpriorityID;
    endLevelButton.events.onInputDown.add(function(){
        this.visible = false;
        GLOBAL.levelManager.LoadNextLevel();
    }, endLevelButton);

    GlassLab.SignalManager.journalClosed.add(function(){
        this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, endLevelButton);

    return endLevelButton;
};

GlassLab.UIManager.prototype._createZoomButton = function()
{

};