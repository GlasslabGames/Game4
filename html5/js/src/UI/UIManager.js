/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;
    this.dragTargets = [];
    this.zoomTo(GlassLab.UIManager.startZoom);

    this._createAnchors();

    this.shade = game.make.graphics().beginFill(0x000000).drawRect(-this.game.width / 2, -this.game.height / 2, this.game.width, this.game.height);
    this.shade.inputEnabled = true; // block interaction with the world
    this.shade.input.priorityID = GLOBAL.UIpriorityID - 1; // below the rest of the UI
    this.shade.alpha = 0.4;
    this.shade.visible = false;
    this.underCenterAnchor.addChild(this.shade);

    // Create the modal that introduces you to the bonus game
    nextButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onBonusPressed, this, 300, 60, 0xffffff, "AWESOME, LET'S DO IT!");
    this.bonusModal = new GlassLab.UIModal(this.game, "Great job! Now it's time for\nBONUS GAME!", nextButton);
    this.centerAnchor.addChild(this.bonusModal);

    this.tutorialArrow = this.game.add.sprite(0,0,"tutorialArrow");
    this.tutorialArrow.scale.set(0.5, 0.5);
    this.tutorialArrow.anchor.set(1.1, 0.5);
    this.tutorialArrowTween = game.add.tween(this.tutorialArrow.scale).to( { x: 0.55 }, 300, Phaser.Easing.Linear.InOut, true, 0, 150, true);
    this.tutorialArrowTween.pause();
    this.tutorialArrow.visible = false;

    this.createHud();

    this.openWindows = [];
    GlassLab.SignalManager.uiWindowOpened.add(this._onUIOpened, this);
    GlassLab.SignalManager.uiWindowClosed.add(this._onUIClosed, this);
};


GlassLab.UIManager.prototype._createAnchors = function()
{
    // another center anchor, but lower than the rest of them
    this.underCenterAnchor = new GlassLab.UIAnchor(this.game, .5, .5);
    GLOBAL.UILayer.add(this.underCenterAnchor);

    // Top left
    this.topLeftAnchor = new GlassLab.UIAnchor(this.game, 0, 0);
    GLOBAL.UILayer.add(this.topLeftAnchor);
    // Top center
    this.topAnchor = new GlassLab.UIAnchor(this.game, .5, 0);
    GLOBAL.UILayer.add(this.topAnchor);
    // Top right
    this.topRightAnchor = new GlassLab.UIAnchor(this.game, 1, 0);
    GLOBAL.UILayer.add(this.topRightAnchor);

    // Left
    this.leftAnchor = new GlassLab.UIAnchor(this.game, 0, .5);
    GLOBAL.UILayer.add(this.leftAnchor);
    // Right
    this.rightAnchor = new GlassLab.UIAnchor(this.game, 1, .5);
    GLOBAL.UILayer.add(this.rightAnchor);

    // Bottom left
    this.bottomLeftAnchor = new GlassLab.UIAnchor(this.game, 0, 1);
    GLOBAL.UILayer.add(this.bottomLeftAnchor);
    // Bottom center
    this.bottomAnchor = new GlassLab.UIAnchor(this.game, .5, 1);
    GLOBAL.UILayer.add(this.bottomAnchor);
    // Bottom right
    this.bottomRightAnchor = new GlassLab.UIAnchor(this.game, 1, 1);
    GLOBAL.UILayer.add(this.bottomRightAnchor);

    // Center - above the rest for convenient use with modals, etc
    this.centerAnchor = new GlassLab.UIAnchor(this.game, .5, .5);
    GLOBAL.UILayer.add(this.centerAnchor);

    // Another anchor in the center, but make sure it's above everything
    this.transitionAnchor = new GlassLab.UIAnchor(this.game, .5, .5);
    GLOBAL.UILayer.add(this.transitionAnchor);
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

GlassLab.UIManager.prototype._onBonusPressed = function()
{
    this.bonusModal.Hide();
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
// By the way this functionality is already built in to Phaser.Text... HAHA
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


GlassLab.UIManager.prototype._onUIOpened = function(window) {
    if (this.openWindows.indexOf(window) == -1) this.openWindows.push(window);
    //console.log("Opened:", this.openWindows);
    if (!this.shade.visible) {
        this.shade.visible = true;
        this.game.add.tween(this.shade).to({alpha: 0.4}, (0.4 - this.shade.alpha) * 500, Phaser.Easing.Quadratic.InOut, true);
    } else {
        this.shade.alpha = 0.4;
    }

    if (GLOBAL.dayManager.dayMeter.visible && this._wantToHideDayMeter()) {
        var tween = this.game.add.tween(GLOBAL.dayManager.dayMeter).to({alpha: 0}, GLOBAL.dayManager.dayMeter.alpha * 150, Phaser.Easing.Quadratic.InOut, true);
        tween.onComplete.addOnce(function() { if (this._wantToHideDayMeter()) GLOBAL.dayManager.dayMeter.visible = false; }, this);
    }
};

GlassLab.UIManager.prototype._onUIClosed = function(window) {
    var index = this.openWindows.indexOf(window);
    if (index > -1) this.openWindows.splice(index, 1);
    //console.log("Closed:",this.openWindows);
    if (this.openWindows.length == 0) {
        if (this.shade.visible) {
            var shadeTween = this.game.add.tween(this.shade).to({alpha: 0}, this.shade.alpha * 500, Phaser.Easing.Quadratic.InOut, true);
            shadeTween.onComplete.addOnce(function() { if (this.openWindows.length == 0) this.shade.visible = false; }, this);
        } else {
            this.shade.alpha = 0;
        }

        GLOBAL.dayManager.dayMeter.visible = true;
    }

    if (!this._wantToHideDayMeter()) {
        if (!GLOBAL.dayManager.dayMeter.visible) {
            GLOBAL.dayManager.dayMeter = true;
            this.game.add.tween(GLOBAL.dayManager.dayMeter).to({alpha: 1}, (1 - GLOBAL.dayManager.dayMeter) * 150, Phaser.Easing.Quadratic.InOut, true);
        } else {
            GLOBAL.dayManager.dayMeter.alpha = 1;
        }
    }
};

// for now, we hide the day meter if a UIWindow is open. Could be changed later.
GlassLab.UIManager.prototype._wantToHideDayMeter = function() {
    for (var i = 0; i < this.openWindows.length; i++) {
        if (this.openWindows[i] instanceof GlassLab.UIWindow) return true;
    }
    return false;
};

GlassLab.UIManager.zoomAmount = 1.5;
GlassLab.UIManager.startZoom = 0.4;
GlassLab.UIManager.maxZoom = GlassLab.UIManager.startZoom * GlassLab.UIManager.zoomAmount;
GlassLab.UIManager.minZoom = GlassLab.UIManager.startZoom / GlassLab.UIManager.zoomAmount / GlassLab.UIManager.zoomAmount / GlassLab.UIManager.zoomAmount;

GlassLab.UIManager.prototype.zoomTo = function(zoomLevel) {
    this.zoomLevel = Math.max( Math.min(GlassLab.UIManager.maxZoom, zoomLevel), GlassLab.UIManager.minZoom);
    GLOBAL.WorldLayer.scale.x = GLOBAL.WorldLayer.scale.y = this.zoomLevel;
};

GlassLab.UIManager.prototype.zoomIn = function() {
    this.zoomTo(this.zoomLevel * GlassLab.UIManager.zoomAmount);
};

GlassLab.UIManager.prototype.zoomOut = function() {
    this.zoomTo(this.zoomLevel / GlassLab.UIManager.zoomAmount);
};


GlassLab.UIManager.prototype.resetCamera = function() {
    this.zoomTo(GlassLab.UIManager.startZoom);
    GLOBAL.game.camera.x = -GLOBAL.game.camera.width/2;
    GLOBAL.game.camera.y = -GLOBAL.game.camera.height/2;
};

GlassLab.UIManager.prototype.createHud = function() {
    
    // TOP RIGHT.....
    var table = new GlassLab.UITable(this.game, 1, 2);
    this.hudTable = table;
    this.topRightAnchor.addChild(table);

    // pause:
    var button = new GlassLab.HUDButton(this.game, 0, 0, "pauseIcon", "hudSettingsBgRounded", null, null, true, function() {
        GLOBAL.pauseMenu.toggle();
    }, this);
    table.addManagedChild(button);

    // zoom in/out:
    // for some reason the position in the table is a little off unless we set the y to 2 here
    var zoomGroup = new GlassLab.UIElement(this.game);

    button = new GlassLab.HUDButton(this.game, 0, 2, "zoomInIcon", "hudSettingsBg", null, null, true, this.zoomIn, this);
    zoomGroup.addChild(button);
    zoomGroup.actualHeight = button.getHeight();
    button = new GlassLab.HUDButton(this.game, 0, 2 + zoomGroup.actualHeight, "zoomOutIcon", "hudSettingsBg", null, null, true, this.zoomOut, this);
    zoomGroup.addChild(button);
    zoomGroup.actualHeight += button.getHeight();
    this.zoomButtons = zoomGroup;

    table.addManagedChild(zoomGroup);

    button = new GlassLab.HUDButton(this.game, 0, 2, "cancelIcon", "hudSettingsBg", null, null, true, function() {
        GLOBAL.mailManager.cancelOrder();
    }, this);
    var container = new GlassLab.UIElement(this.game); // the reason we have to make a container is to work with the weird y-2 hack
    container.actualHeight = button.getHeight();
    container.addChild(button);
    container.visible = false
    table.addManagedChild(container);
    this.cancelButton = container;

    // fullscreen:
    var fullscreenButton = new GlassLab.HUDButton(this.game, 0, 0, "fullscreenIcon", "hudSettingsBgRounded", null, null, true, function() {
        if (this.game.scale.isFullScreen) {
            this.game.scale.stopFullScreen();
            fullscreenButton.image.loadTexture("fullscreenIcon");
        }
        else {
            this.game.scale.startFullScreen(false);
            fullscreenButton.image.loadTexture("fullscreenOffIcon");
        }
    }, this);
    fullscreenButton.bg.scale.y *= -1;
    table.addManagedChild(fullscreenButton);
    table._refresh();
    table.position.setTo( (table.getWidth() / -2) - 20, (button.getHeight() / 2) + 20 );

    // TOP LEFT.....
    table = new GlassLab.UITable(this.game, 1, 20);
    this.topLeftAnchor.addChild(table);

    // journal:
    this.journalButton = new GlassLab.HUDAnimButton(this.game, 0,0, "notesIcon", "hudBg", false, this._onJournalButton, this );
    this.journalButton.image.position.setTo(0, 8);
    table.addManagedChild(this.journalButton);

    GlassLab.SignalManager.journalOpened.add(function() { this.toggleOpen(true); }, this.journalButton);
    GlassLab.SignalManager.journalClosed.add(function() { this.toggleOpen(false); }, this.journalButton);

    // mail/orders:
    this.mailButton = new GlassLab.HUDAnimButton(this.game, 0,0, "mailIcon", "hudBg", false, this._onMailButton, this );
    this.mailButton.image.position.setTo(0, 10);
    table.addManagedChild(this.mailButton, true);

    GlassLab.SignalManager.mailOpened.add(function() { this.toggleOpen(true); }, this.mailButton);
    GlassLab.SignalManager.mailClosed.add(function() { this.toggleOpen(false); }, this.mailButton);
    GlassLab.SignalManager.ordersChanged.add(this._refreshMailButton, this);

    GlassLab.SignalManager.orderStarted.add(function() { this.visible = false; }, this.mailButton); // hide when we start filling an order
    GlassLab.SignalManager.orderCanceled.add(function() { this.visible = true; }, this.mailButton); // show if we cancel the order
    GlassLab.SignalManager.orderShipped.add(function() { this.visible = true; }, this.mailButton); // show once the order is fully shipped
    GlassLab.SignalManager.penFeedingStarted.add(function() { this.visible = false; }, this.mailButton); // hide when we start feeding in the pen
    GlassLab.SignalManager.challengeStarted.add(function() { this.visible = true; }, this.mailButton); // show again at the start of a challenge

    table.position.setTo( (table.getWidth() / 2) + 20, (this.mailButton.getHeight() / 2) + 20 );

    // BOTTOM LEFT..... foodIcon/items/inventory (uses 2 sprites for bg):
    this.itemsButton = new GlassLab.HUDAnimButton(this.game, 0,0, "foodIcon", {"bg":"hudBg","bg_open":"foodIconBg_open"}, false, this._onItemsButton, this);
    this.itemsButton.image.position.setTo(0, 15);
    this.bottomLeftAnchor.addChild(this.itemsButton);
    this.itemsButton.position.setTo( (this.itemsButton.getWidth() / 2) + 20, (this.itemsButton.getHeight() / -2) - 20);
    GLOBAL.itemsButton = this.itemsButton;

    this.penTooltip = new GlassLab.UIRatioTooltip(this.game, 5);
    this.topLeftAnchor.addChild(this.penTooltip);

    GlassLab.SignalManager.inventoryOpened.add(function() { this.toggleOpen(true); }, this.itemsButton);
    GlassLab.SignalManager.inventoryClosed.add(function() { this.toggleOpen(false); }, this.itemsButton);
};

GlassLab.UIManager.prototype._onJournalButton = function() {
    GLOBAL.Journal.toggle();
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

    var willActivateMailButton = active && !GLOBAL.mailManager.currentOrder;
    if (!this.mailButton.active && willActivateMailButton)
    {
        GLOBAL.audioManager.playSound("mailNoticeSound");
    }

    this.mailButton.toggleActive(willActivateMailButton);
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

GlassLab.UIManager.prototype.toggleZoomHUDButtons = function(show) {
    if (typeof show == 'undefined') show = !this.zoomButtons.visible;
    this.zoomButtons.visible = show;
    this.hudTable._refresh(true);
};

GlassLab.UIManager.prototype.toggleCancelHUDButton = function(show) {
    if (typeof show == 'undefined') show = !this.cancelButton.visible;
    this.cancelButton.visible = show;
    this.hudTable._refresh(true);
};