/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game, centerAnchor)
{
    this.game = game;
    this.centerAnchor = centerAnchor;

    var retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    var nextButton = new GlassLab.UIButton(this.game, 0, 0, this._onContinuePressed, this, 150, 60, 0xffffff, "Continue");

    this.winModal = new GlassLab.UIModal(this.game, "Good job! You did it!", [retryButton, nextButton]);
    this.centerAnchor.addChild(this.winModal);
    this.winModal.visible = false;

    GlassLab.SignalManager.journalClosed.add(function(){
      this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, this.winModal);

    retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    this.loseModal = new GlassLab.UIModal(this.game, "That wasn't right. Try again?", retryButton);
    this.centerAnchor.addChild(this.loseModal);
    this.loseModal.visible = false;

    GlassLab.SignalManager.levelLost.add(function() {
      this.visible = true
    }, this.loseModal);
};
/*
// TODO: Replace with class  OR combine with FailModal somehow.. like reuse the same modal? (._.)a
GlassLab.UIManager.prototype._createEndLevelModal = function()
{
   var retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
   var nextButton = new GlassLab.UIButton(this.game, 0, 0, this._onContinuePressed, this, 150, 60, 0xffffff, "Continue");
   var endLevelModal = new GlassLab.UIModal(this.game, "Good job! You did it!", [retryButton, nextButton]);
   endLevelModal.visible = false;

    // This seems like a roundabout way to do it... But it makes sense for now
    GlassLab.SignalManager.journalClosed.add(function(){
        this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, endLevelModal);

    return endLevelModal;
};
*/
GlassLab.UIManager.prototype._onRetryPressed = function()
{
  this.winModal.visible = this.loseModal.visible = false;
  GLOBAL.levelManager.RestartLevel();
};

GlassLab.UIManager.prototype._onContinuePressed = function()
{
  this.winModal.visible = this.loseModal.visible = false;
  GLOBAL.levelManager.LoadNextLevel();
};

GlassLab.UIManager.prototype._createZoomButton = function()
{

};