/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;
    this.dragTargets = [];
    this._createAnchors();

    var retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    var nextButton = new GlassLab.UIButton(this.game, 0, 0, this._onContinuePressed, this, 150, 60, 0xffffff, "Continue");

    this.winModal = new GlassLab.UIModal(this.game, "Good job! You did it!", [retryButton, nextButton]);
    this.winModal.y += 220;
    this.centerAnchor.addChild(this.winModal);
    this.winModal.visible = false;

    GlassLab.SignalManager.levelWon.add(function(){
      this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, this.winModal);

    retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    this.loseModal = new GlassLab.UIModal(this.game, "That wasn't right. Try again?", retryButton);
    this.centerAnchor.addChild(this.loseModal);
    this.loseModal.visible = false;

    GlassLab.SignalManager.levelLost.add(function() {
      this.visible = true
    }, this.loseModal);

    //game.input.onDown.add(this._globalDown, this); // Global input down handler
    game.input.onUp.add(this._onGlobalUp, this); // Global input down handler
};

GlassLab.UIManager.prototype._onGlobalUp = function(pointer, DOMevent)
{
    if (GLOBAL.stickyMode && GLOBAL.dragTarget) { // if we were dragging something with sticky mode, release it when we click
        if (GLOBAL.dragTarget.OnStickyDrop) GLOBAL.dragTarget.OnStickyDrop(); // e.g. UIDraggable
        GLOBAL.dragTarget = null;
        GLOBAL.justDropped = true;
    }
};

GlassLab.UIManager.prototype._createAnchors = function()
{
    // Top left
    this.topLeftAnchor = new GlassLab.UIAnchor(this.game, 0, 0);
    GLOBAL.UIGroup.add(this.topLeftAnchor);
    // Top center
    this.topAnchor = new GlassLab.UIAnchor(this.game, .5, 0);
    GLOBAL.UIGroup.add(this.topAnchor);
    // Top right
    this.topRightAnchor = new GlassLab.UIAnchor(this.game, 1, 0);
    GLOBAL.UIGroup.add(this.topRightAnchor);

    // Left
    this.leftAnchor = new GlassLab.UIAnchor(this.game, 0, .5);
    GLOBAL.UIGroup.add(this.leftAnchor);
    // Right
    this.rightAnchor = new GlassLab.UIAnchor(this.game, 1, .5);
    GLOBAL.UIGroup.add(this.rightAnchor);

    // Bottom left
    this.bottomLeftAnchor = new GlassLab.UIAnchor(this.game, 0, 1);
    GLOBAL.UIGroup.add(this.bottomLeftAnchor);
    // Bottom center
    this.bottomAnchor = new GlassLab.UIAnchor(this.game, .5, 1);
    GLOBAL.UIGroup.add(this.bottomAnchor);
    // Bottom right
    this.bottomRightAnchor = new GlassLab.UIAnchor(this.game, 1, 1);
    GLOBAL.UIGroup.add(this.bottomRightAnchor);

    // Center - above the rest for convenient use with modals, etc
    this.centerAnchor = new GlassLab.UIAnchor(this.game, .5, .5);
    GLOBAL.UIGroup.add(this.centerAnchor);
}
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

// General function to check if something was dropped onto a drag target that wants it
GlassLab.UIManager.prototype.tryDropOntoDragTargets = function(draggedObj) {
    for (var i = 0; i < this.dragTargets.length; i++) {
        if (this.dragTargets[i].enabled && this.dragTargets[i].tryDrop(draggedObj)) return true;
    }
    return false;
};