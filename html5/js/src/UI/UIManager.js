/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UIManager = function(game)
{
    this.game = game;
    this.dragTargets = [];
    this.snapZoomTo(GlassLab.UIManager.startZoom);

    this._createAnchors();

    // Create a dark shade that covers the game when a UIWindow is up
    this.shade = game.make.graphics().beginFill(0x000000).drawRect(-this.game.width / 2, -this.game.height / 2, this.game.width, this.game.height);
    this.shade.inputEnabled = true; // block interaction with the world
    this.shade.events.onInputUp.add(this.hideAllWindows, this); // close the window if they click anywhere
    this.shade.input.priorityID = GLOBAL.UIpriorityID - 1; // below the rest of the UI
    this.shade.alpha = 0.4;
    this.shade.visible = false;
    this.underCenterAnchor.addChild(this.shade);

    this.game.scale.onSizeChange.add(function() { // redraw the shade if they resize the window
        this.shade.clear().beginFill(0x000000).drawRect(-this.game.width / 2, -this.game.height / 2, this.game.width, this.game.height);
    }, this);

    this.shadeTween = null; // pointer to single shade tween instance

    // Create the modal that introduces you to the bonus game
    nextButton = new GlassLab.UIRectButton(this.game, 0, 0, this._onBonusPressed, this, 300, 60, 0xffffff, "AWESOME, LET'S DO IT!");
    this.bonusModal = new GlassLab.UIModal(this.game, "Great job! Now it's time for\nBONUS GAME!", nextButton);
    this.centerAnchor.addChild(this.bonusModal);

    this.tutorialArrow = this.game.add.sprite(0,0,"tutorialArrow");
    this.tutorialArrow.animations.add("anim");
    this.tutorialArrow.play("anim", 24, true);
    this.tutorialArrow.anchor.set(1.1, 0.5);
    this.tutorialArrow.visible = false;

    this.flyingCoins = this.transitionAnchor.addChild(game.make.sprite());
    for (var i = 1; i <= 4; i++) {
        var coin = this.flyingCoins.addChild(game.make.sprite(0, 0, "coinAnim"));
        coin.animations.add("fly", Phaser.Animation.generateFrameNames("get_money_coin_fly_"+i+"_",0,32,".png",3), 24);
        coin.anchor.setTo(0.5, 0.5);
    }

    this.createHud();

    this.openWindows = [];
    GlassLab.SignalManager.uiWindowOpened.add(this._onUIOpened, this);
    GlassLab.SignalManager.uiWindowClosed.add(this._onUIClosed, this);

    this.zoomTween = null;
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

    // Another anchor in the bottom right, used for the assistant
    this.tutorialAnchor = new GlassLab.UIAnchor(this.game, 1, 1);
    GLOBAL.UILayer.add(this.tutorialAnchor);

    // Another anchor in the center, but make sure it's above everything
    this.transitionAnchor = new GlassLab.UIAnchor(this.game, .5, .5);
    GLOBAL.UILayer.add(this.transitionAnchor);
};

GlassLab.UIManager.prototype.showAnchoredArrow = function(direction, anchorName, x, y) {
    this.showArrow(direction, this[anchorName], x, y);
};

GlassLab.UIManager.prototype.showArrow = function(direction, parent, x, y) {
    if (!parent) return;

    var angle = 0;
    switch (direction) {
        case "right": angle = 180; break
        case "up": angle = 90; break;
        case "down": angle = -90; break;
    }
    this.tutorialArrow.visible = true;
    this.tutorialArrow.parent = parent;
    this.tutorialArrow.angle = angle;
    this.tutorialArrow.x = x;
    this.tutorialArrow.y = y;
};

GlassLab.UIManager.prototype.hideArrow = function() {
    this.tutorialArrow.visible = false;
};

GlassLab.UIManager.prototype._onBonusPressed = function()
{
    this.bonusModal.hide();
    GLOBAL.sortingGame.start();
};

GlassLab.UIManager.prototype.startFlyingCoins = function(callback, callbackContext)
{
    // Do the callback as soon as the first coins hits its destination
    if (callback) this.flyingCoins.getChildAt(0).events.onAnimationComplete.addOnce(callback, callbackContext);

    // Remember that coins are flying until the final coin hits its destination
    this.coinsFlying = true;
    this.flyingCoins.getChildAt(this.flyingCoins.children.length-1).events.onAnimationComplete.addOnce(function() {
        this.coinsFlying = false;
    }, this);

    // Start each coin 1/10s of a second apart
    for (var i = 0; i < this.flyingCoins.children.length; i++) {
        var coin = this.flyingCoins.getChildAt(i);
        coin.visible = true;
        this.game.time.events.add(100*i, function() { this.play("fly"); }, coin);
    }
};

GlassLab.UIManager.prototype.hideFlyingCoins = function() {
    for (var i = 0; i < this.flyingCoins.children.length; i++) {
        var coin = this.flyingCoins.getChildAt(i);
        if (coin.animations.currentAnim) coin.animations.currentAnim.stop(true, true);
        coin.visible = false;
    }
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
    //console.log("Opened:", this.openWindows.length);

    // stop alpha tween if it's still running:
    if (this.shadeTween != null && this.shadeTween.isRunning) {
        this.shadeTween.stop();
    }

    // fade in the shade:
    if (isNaN(this.shade.alpha)) this.shade.alpha = 0; // normally just use whatever we have, but if it became NaN for some reason, fix it
    this.shade.visible = true;
    this.shadeTween = this.game.add.tween(this.shade).to({alpha: 0.4}, (0.4 - this.shade.alpha) * 500, Phaser.Easing.Quadratic.InOut, true);

    if (GLOBAL.dayManager.dayMeter.visible && this._wantToHideDayMeter()) {
        var tween = this.game.add.tween(GLOBAL.dayManager.dayMeter).to({alpha: 0}, GLOBAL.dayManager.dayMeter.alpha * 150, Phaser.Easing.Quadratic.InOut, true);
        tween.onComplete.addOnce(function() { if (this._wantToHideDayMeter()) GLOBAL.dayManager.dayMeter.visible = false; }, this);
    }
};

GlassLab.UIManager.prototype._onUIClosed = function(window) {
    var index = this.openWindows.indexOf(window);
    if (index > -1) this.openWindows.splice(index, 1);
    //console.log("Closed:", this.openWindows.length);

    if (this.openWindows.length == 0) {

        // stop alpha tween if it's still running:
        if (this.shadeTween != null && this.shadeTween.isRunning) {
            this.shadeTween.stop();
        }

        // fade out the shade:
        if (isNaN(this.shade.alpha)) this.shade.alpha = 1; // normally just use whatever we have, but if it became NaN for some reason, fix it
        this.shadeTween = this.game.add.tween(this.shade).to({alpha: 0}, this.shade.alpha * 500, Phaser.Easing.Quadratic.InOut, true);
        this.shadeTween.onComplete.addOnce(function() {
                this.shade.alpha = 0; // better safe than sorry
                //console.log("Closed:",this.openWindows);
            }, this);
        

        GLOBAL.dayManager.dayMeter.visible = true;

        // pop the inventory menu back up if it was closed before. This may have to be refined to only start after everything is done closing (showInsteadOfOtherWindows), but it's fine for now.
        if (this.inventoryWasOpen) GLOBAL.inventoryMenu.show();
        this.inventoryWasOpen = false;
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

GlassLab.UIManager.prototype.hideAllWindows = function(exception) {
    //console.log("Hide all ", this.openWindows.length, "windows. Exception?", !!exception);
    for (var i = 0; i < this.openWindows.length; i++) {
        if (this.openWindows[i] != exception && this.openWindows[i].autoCloseable) {
            this.openWindows[i].hide();
        }
    }

    // hide the inventory if it's open (even though we don't add it as an openWindow, we still want to hide it in this case
    if (GLOBAL.inventoryMenu.visible) {
        this.inventoryWasOpen = true;
        GLOBAL.inventoryMenu.hide();
    }
};

GlassLab.UIManager.prototype.showInsteadOfOtherWindows = function(window, withoutAddingToList) {
    var addedListener = false;

    //console.log("Show",window,"instead of",this.openWindows.length,"other windows");

    if (!withoutAddingToList && this.openWindows.indexOf(window) == -1) this.openWindows.push(window); // so we don't unfade the background, etc

    // add an event listener to one of the windows we're about to hide
    for (var i = 0; i < this.openWindows.length; i++) {
        if (this.openWindows[i] == window) continue;
        if (this.openWindows[i].onFinishedHiding && this.openWindows[i].autoCloseable) {
            this.openWindows[i].onFinishedHiding.addOnce(window.show, window);
            addedListener = true;
            break;
        }
    }
    this.hideAllWindows(window); // hide everything but the one we want to show
    if (!addedListener) window.show(); // if we failed to add a listener, just show the target
};

GlassLab.UIManager.zoomAmount = 1.8;
GlassLab.UIManager.maxZoom = 1.0;
GlassLab.UIManager.minZoom = GlassLab.UIManager.maxZoom / Math.pow(GlassLab.UIManager.zoomAmount, 3); // 4 zoom levels
GlassLab.UIManager.startZoom = GlassLab.UIManager.maxZoom / GlassLab.UIManager.zoomAmount;

GlassLab.UIManager.prototype.enforceCameraBounds = function()
{
    var xLimit = 3500 * GLOBAL.WorldLayer.scale.x;
    var camX = this.game.camera.x + this.game.camera.width/2;
    var camY = this.game.camera.y + this.game.camera.height/2;
    if (camX > xLimit) // xLimit found by testing in game
    {
        this.game.camera.x = xLimit - this.game.camera.width/2;
        camX = this.game.camera.x + this.game.camera.width/2;
    }
    else if (camX < -xLimit)
    {
        this.game.camera.x = -xLimit - this.game.camera.width/2;
        camX = this.game.camera.x + this.game.camera.width/2;
    }

    var yLimit = 1750 * GLOBAL.WorldLayer.scale.y * (1-Math.abs(camX/ xLimit));
    if (camY > yLimit)
    {
        this.game.camera.y = yLimit - this.game.camera.height/2;
    }
    else if (camY < -yLimit)
    {
        this.game.camera.y = -yLimit - this.game.camera.height/2;
    }
};

GlassLab.UIManager.prototype.snapZoomTo = function(zoomLevel, dontConstrain)
{
    if (dontConstrain) this.zoomLevel = zoomLevel;
    else this.zoomLevel = Math.max( Math.min(GlassLab.UIManager.maxZoom, zoomLevel), GlassLab.UIManager.minZoom);

    if (this.zoomTween)
    {
        this.zoomTween.stop();
    }

    GLOBAL.WorldLayer.scale.setTo(this.zoomLevel, this.zoomLevel);

    if (!dontConstrain) this.enforceCameraBounds();

    GlassLab.SignalManager.cameraMoved.dispatch();
    GlassLab.SignalManager.zoomChanged.dispatch();
};

GlassLab.UIManager.prototype.zoomTo = function(zoomLevel, dontConstrain)
{
    if (dontConstrain) this.zoomLevel = zoomLevel;
    else this.zoomLevel = Math.max( Math.min(GlassLab.UIManager.maxZoom, zoomLevel), GlassLab.UIManager.minZoom);

    if (this.zoomTween)
    {
        this.zoomTween.stop();
    }

    this.zoomTween = this.game.add.tween(GLOBAL.WorldLayer.scale).to ( {x: this.zoomLevel, y: this.zoomLevel}, 300, Phaser.Easing.Quadratic.InOut);
    this.zoomTween.onComplete.add(function()
    {
        this.zoomTween = null;
    }, this);

    this.zoomTween.onUpdateCallback( function() {
        if (!dontConstrain) this.enforceCameraBounds();
        GlassLab.SignalManager.cameraMoved.dispatch();
    }, this);
    this.zoomTween.start();

    GlassLab.SignalManager.zoomChanged.dispatch();
};

GlassLab.UIManager.prototype.zoomIn = function() {
    this.zoomTo(this.zoomLevel * GlassLab.UIManager.zoomAmount);
};

GlassLab.UIManager.prototype.zoomOut = function() {
    this.zoomTo(this.zoomLevel / GlassLab.UIManager.zoomAmount);
};


GlassLab.UIManager.prototype.resetCamera = function() {
    console.log("Reseting camera");
    this.zoomTo(GlassLab.UIManager.startZoom);
    if (GLOBAL.penManager.pens.length) GLOBAL.penManager.focusCameraOnPen(); // center the camera over the pen
    else this.setCenterCameraPos(0, 0); // center in the middle of the screen
};

GlassLab.UIManager.prototype.setCenterCameraPos = function(x, y) {
    GLOBAL.game.camera.x = x - GLOBAL.game.camera.width/2;
    GLOBAL.game.camera.y = y - GLOBAL.game.camera.height/2;

    this.enforceCameraBounds();
    GlassLab.SignalManager.cameraMoved.dispatch();
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
    fullscreenButton.setEnabled(GLOBAL.fullScreenAllowed);
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
    if (GLOBAL.Journal.open) {
        GLOBAL.Journal.hide();
    } else {
        this.showInsteadOfOtherWindows(GLOBAL.Journal);
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
        this.showInsteadOfOtherWindows(GLOBAL.inventoryMenu, true); // closes everything else and opens the inventory, but doesn't actually count it as an open window
    } else {
        GLOBAL.inventoryMenu.hide();
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