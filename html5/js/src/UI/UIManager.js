/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;
    this.dragTargets = [];
    this.zoomTo(0.5);

    this._createAnchors();

    // Create the modal that shows when you win a level
    var nextButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onContinuePressed, this, 150, 60, 0xffffff, "Continue");
    this.winModal = new GlassLab.UIModal(this.game, "Good job! You did it!", nextButton);
    this.centerAnchor.addChild(this.winModal);
    this.winModal.visible = false;

    // Create the modal that shows when you lose a level
    var retryButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onRetryPressed, this, 150, 60, 0xffffff, "Retry");
    this.loseModal = new GlassLab.UIModal(this.game, "That wasn't right. Try again?", retryButton);
    this.centerAnchor.addChild(this.loseModal);
    this.loseModal.visible = false;

    GlassLab.SignalManager.levelLost.add(function() {
        GLOBAL.audioManager.playSound("fail");
      this.visible = true;
    }, this.loseModal);

    // Create the modal that introduces you to the bonus game
    nextButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onBonusPressed, this, 300, 60, 0xffffff, "AWESOME, LET'S DO IT!");
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

    this.createHud();
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

GlassLab.UIManager.prototype._onRetryPressed = function()
{
    this.winModal.visible = this.loseModal.visible = false;
    GLOBAL.questManager.failChallenge();
};

GlassLab.UIManager.prototype._onContinuePressed = function()
{
    this.winModal.visible = this.loseModal.visible = false;
    GLOBAL.questManager.completeChallenge();
};

GlassLab.UIManager.prototype._onBonusPressed = function()
{
    this.bonusModal.visible = false;
    GLOBAL.sortingGame.start();
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

GlassLab.UIManager.maxZoom = 1;
GlassLab.UIManager.minZoom = 0.125;

GlassLab.UIManager.prototype.zoomTo = function(zoomLevel) {
    this.zoomLevel = Math.max( Math.min(GlassLab.UIManager.maxZoom, zoomLevel), GlassLab.UIManager.minZoom);
    GLOBAL.WorldLayer.scale.x = GLOBAL.WorldLayer.scale.y = this.zoomLevel;
};

GlassLab.UIManager.prototype.zoomIn = function() {
    this.zoomTo(this.zoomLevel * 2);
};

GlassLab.UIManager.prototype.zoomOut = function() {
    this.zoomTo(this.zoomLevel / 2);
};

GlassLab.UIManager.prototype.createHud = function() {
    var table = new GlassLab.UITable(this.game, 1, 3);
    this.topRightAnchor.addChild(table);

    // pause icon
    var button = new GlassLab.HUDButton(this.game, 0, 0, "pauseIcon", "hudSettingsBgRounded", true, function() {
        GLOBAL.pauseMenu.toggle();
    }, this);
    table.addManagedChild(button);

    var zoomGroup = new GlassLab.UIElement(this.game);
    table.addManagedChild(zoomGroup);

    // for some reason the position in the table is a little off unless we set the y to 1 here
    button = new GlassLab.HUDButton(this.game, 0, 1, "zoomInIcon", "hudSettingsBg", true, this.zoomIn, this);
    zoomGroup.addChild(button);
    zoomGroup.actualHeight = button.getHeight();

    button = new GlassLab.HUDButton(this.game, 0, 1 + zoomGroup.actualHeight, "zoomOutIcon", "hudSettingsBg", true, this.zoomOut, this);
    zoomGroup.addChild(button);
    zoomGroup.actualHeight += button.getHeight();

    var fullscreenButton = new GlassLab.HUDButton(this.game, 0, 0, "fullscreenIcon", "hudSettingsBgRounded", true, function() {
        if (game.scale.isFullScreen)
        {
            game.scale.stopFullScreen();
            fullscreenButton.image.loadTexture("fullscreenIcon");
        }
        else
        {
            game.scale.startFullScreen(false);
            fullscreenButton.image.loadTexture("fullscreenOffIcon");
        }
    }, this);
    fullscreenButton.bg.scale.y *= -1;
    table.addManagedChild(fullscreenButton);

    table._refresh();
    table.position.setTo( (table.getWidth() / -2) - 20, (button.getHeight() / 2) + 20 );


    table = new GlassLab.UITable(this.game, 1, 20);
    this.topLeftAnchor.addChild(table);

    this.journalButton = new GlassLab.HUDAnimButton(this.game, 0,0, "notesIcon", "hudBg", false, this._onJournalButton, this );
    this.journalButton.image.position.setTo(0, 8);
    table.addManagedChild(this.journalButton);

    GlassLab.SignalManager.journalOpened.add(function() { this.toggleOpen(true); }, this.journalButton);
    GlassLab.SignalManager.journalClosed.add(function() { this.toggleOpen(false); }, this.journalButton);

    this.mailButton = new GlassLab.HUDAnimButton(this.game, 0,0, "mailIcon", "hudBg", false, this._onMailButton, this );
    this.mailButton.image.position.setTo(0, 10);
    GLOBAL.ordersButton = this.mailButton;
    table.addManagedChild(this.mailButton, true);

    GlassLab.SignalManager.mailOpened.add(function() { this.toggleOpen(true); }, this.mailButton);
    GlassLab.SignalManager.mailClosed.add(function() { this.toggleOpen(false); }, this.mailButton);
    GlassLab.SignalManager.ordersChanged.add(this._refreshMailButton, this);

    table.position.setTo( (table.getWidth() / 2) + 20, (this.mailButton.getHeight() / 2) + 20 );

    this.itemsButton = new GlassLab.HUDAnimButton(this.game, 0, 0, "foodIcon", "hudBg", false, this._onItemsButton, this);
    this.itemsButton.image.position.setTo(0, 15);
    this.bottomLeftAnchor.addChild(this.itemsButton);
    this.itemsButton.position.setTo( (this.itemsButton.getWidth() / 2) + 20, (this.itemsButton.getHeight() / -2) - 20);
    GLOBAL.itemsButton = this.itemsButton;

    GlassLab.SignalManager.inventoryOpened.add(function() { this.toggleOpen(true); }, this.itemsButton);
    GlassLab.SignalManager.inventoryClosed.add(function() { this.toggleOpen(false); }, this.itemsButton);
};

GlassLab.UIManager.prototype._onJournalButton = function() {
    if (!GLOBAL.Journal.IsShowing()) {
        GLOBAL.Journal.Show();
    } else {
        GLOBAL.Journal.Hide();
    }
    this.journalButton.toggleActive(false); // no need to stay active after it's been clicked
};

GlassLab.UIManager.prototype._refreshMailButton = function() {
    var hasMail = GLOBAL.mailManager.availableOrders.length || GLOBAL.mailManager.rewards.length;
    this.mailButton.toggleFull(hasMail);
    var active = GLOBAL.mailManager.rewards.length; // if we have a reward, then active should be true
    if (!active && hasMail) { // else if we have a key order, then active should be true
        for (var i = 0; i < GLOBAL.mailManager.availableOrders.length; i++) {
            if (GLOBAL.mailManager.availableOrders[i].key) {
                active = true;
                break;
            }
        }
    }
    this.mailButton.toggleActive(active && !GLOBAL.mailManager.currentOrder);
};

GlassLab.UIManager.prototype._onMailButton = function() {
    if (!GLOBAL.mailManager.IsMailShowing()) {
        GLOBAL.mailManager.ShowMail();
    } else {
        GLOBAL.mailManager.HideMail();
    }
};

GlassLab.UIManager.prototype._onItemsButton = function() {
    if (!GLOBAL.inventoryMenu.visible) {
        GLOBAL.inventoryMenu.Show();
    } else {
        GLOBAL.inventoryMenu.Hide();
    }
    this.itemsButton.toggleActive(false); // no need to stay active after it's been clicked
};