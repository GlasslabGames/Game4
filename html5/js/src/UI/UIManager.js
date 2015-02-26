/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;
    this.dragTargets = [];

    this._createAnchors();

    // Create the modal that shows when you win a level
    var retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    var nextButton = new GlassLab.UIButton(this.game, 0, 0, this._onContinuePressed, this, 150, 60, 0xffffff, "Continue");

    this.winModal = new GlassLab.UIModal(this.game, "Good job! You did it!", [retryButton, nextButton]);
    this.winModal.y += 220;
    this.centerAnchor.addChild(this.winModal);
    this.winModal.visible = false;

    // Create the modal that shows when you lose a level
    retryButton = new GlassLab.UIButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    this.loseModal = new GlassLab.UIModal(this.game, "That wasn't right. Try again?", retryButton);
    this.centerAnchor.addChild(this.loseModal);
    this.loseModal.visible = false;

    GlassLab.SignalManager.levelLost.add(function() {
      this.visible = true
    }, this.loseModal);

    // Create the modal that introduces you to the bonus game
    nextButton = new GlassLab.UIButton(this.game, 0, 0, this._onBonusPressed, this, 300, 60, 0xffffff, "AWESOME, LET'S DO IT!");
    this.bonusModal = new GlassLab.UIModal(this.game, "Great job! Now it's time for\nBONUS GAME!", nextButton);
    this.centerAnchor.addChild(this.bonusModal);
    this.bonusModal.visible = false;

    // The win modal used to pop up, but we're replacing it with the bonus modal instead
    GlassLab.SignalManager.levelWon.add(function(){
        this.visible = GLOBAL.levelManager.GetCurrentLevel().isCompleted;
    }, this.bonusModal);

    //game.input.onDown.add(this._globalDown, this); // Global input down handler
    game.input.onUp.add(this._onGlobalUp, this); // Global input down handler

    this.tutorialArrow = this.game.add.sprite(0,0,"tutorialArrow");
    this.tutorialArrow.scale.set(0.5, 0.5);
    this.tutorialArrow.anchor.set(1.1, 0.5);
    this.tutorialArrowTween = game.add.tween(this.tutorialArrow.scale).to( { x: 0.55 }, 300, Phaser.Easing.Linear.InOut, true, 0, 150, true);
    this.tutorialArrowTween.pause();
    this.tutorialArrow.visible = false;
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
};

GlassLab.UIManager.prototype.showAnchoredArrow = function(direction, anchorName, x, y) {
    this.showArrow(direction, this[anchorName], x, y);
};

GlassLab.UIManager.prototype.showArrow = function(direction, parent, x, y) {
    if (!parent) return;

    this.tutorialArrowTween.resume();
    var angle = 0;
    switch (direction) {
        case "left": angle = 180; break
        case "up": angle = -90; break;
        case "down": angle = 90; break;
    }
    this.tutorialArrow.visible = true;
    this.tutorialArrow.parent = parent;
    this.tutorialArrow.angle = angle;
    this.tutorialArrow.x = x;
    this.tutorialArrow.y = y;
};

GlassLab.UIManager.prototype.hideArrow = function() {
    this.tutorialArrowTween.pause();
    this.tutorialArrow.visible = false;
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

  if (GLOBAL.saveManager.HasData("default_checkpoint"))
  {
      GLOBAL.saveManager.Load("default_checkpoint");
  }
    else
  {
      GLOBAL.levelManager.RestartLevel();
  }
};

GlassLab.UIManager.prototype._onContinuePressed = function()
{
  this.winModal.visible = this.loseModal.visible = false;
  GLOBAL.levelManager.LoadNextLevel();
};

GlassLab.UIManager.prototype._onBonusPressed = function()
{
    this.bonusModal.visible = false;
    GLOBAL.levelManager.LoadNextBonusGame();
};

GlassLab.UIManager.prototype._createZoomButton = function()
{

};

// General function to check if something was dropped onto a drag target that wants it
GlassLab.UIManager.prototype.getDragTarget = function(draggedObj) {
    for (var i = 0; i < this.dragTargets.length; i++) {
        var target = this.dragTargets[i];
        if (target.enabled && target._checkOverlap(draggedObj) && // TODO: fix checking the overlap
            target.canDrop(draggedObj) && draggedObj.canDropOnto(target)) {
            return target;
        }
    }
    return null;
};

// Static function that figures out where to put line breaks in order to wrap a segment of text.
// It sets the text in the provided label but also return the string
GlassLab.UIManager.wrapText = function(label, text, maxWidth) {

    // Try adding the words one by one
    var words = text.split(" ");
    label.text = words[0];
    var prevText, testWord;
    for (var i = 1; i < words.length; i++) {
        prevText = label.text;
        label.text += " " + words[i]; // test what happens if we append the word
        if (label.width > maxWidth) { // if that makes the label too wide
            label.text = prevText + "\n" + words[i]; // make a new line instead
        }
    }

    return label.text; // returns the text with newlines inserted
};