/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.endLevelButton = game.make.button(0,0,"closeIcon");
    GLOBAL.UILayer.add(this.endLevelButton);
    this.endLevelButton.visible = false;
    this.endLevelButton.inputEnabled = true;
    this.endLevelButton.events.onInputDown.add(function(){
        GLOBAL.levelManager.LoadNextLevel();
    }, this);
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

GlassLab.UIManager.prototype._createZoomButton = function()
{

};