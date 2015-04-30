/**
 * Created by Jerry Fu on 3/27/2015.
 */
var GlassLab = GlassLab || {};

/**
 * UIRatioTooltip
 */
GlassLab.UIRatioTooltip = function(game, padding)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);

    var numberStyle = {font: "24pt EnzoBlack", fill: "#ffffff"};
    var colonStyle = {font: "24pt EnzoBlack", fill: "#cccccc"};

    this.game = game;
    this.padding = padding;

    this.visible = false;

    this.changeDelay = 150;
    this.changeCountdown = 0;

    this.root = this.game.make.sprite(0, -10); // base that can adjust the position of everything without affecting the scale effect
    this.addChild(this.root);

    this.bgContainer = new GlassLab.UITable(game, 3, 0);
    var bgLeft = this.game.make.sprite(0,0,"penTooltipCap");
    this.bgContainer.addManagedChild(bgLeft);
    this.bgCenter = this.game.make.sprite(0,0,"penTooltipWidth");
    this.bgContainer.addManagedChild(this.bgCenter);
    var bgRight = this.game.make.sprite(0,0,"penTooltipCap");
    bgRight.scale.setTo(-1, 1);
    bgRight.anchor.setTo(1, 0);
    this.bgContainer.addManagedChild(bgRight, true);
    this.bgRight = bgRight;
    this.bgLeft = bgLeft;

    this.arrow = this.game.make.sprite(0,-15,"questObjectiveArrow");
    this.arrow.scale.y = -1;
    this.arrow.anchor.setTo(.5, 1);
    this.root.addChild(this.arrow);

    bgLeft.alpha = this.bgCenter.alpha = bgRight.alpha = this.arrow.alpha = 0.75;
    this.bgCenter.tint = bgLeft.tint = bgRight.tint = this.arrow.tint = 0x000000;
    this.root.addChild(this.bgContainer);

    var iconScale = 0.8;

    this.contentsContainer = new GlassLab.UITable(game, 8, 5);
    this.creatureIcon = this.game.make.sprite(0,0, "rammus_sticker");
    this.creatureIcon.scale.setTo(iconScale * 0.5, iconScale * 0.5);
    this.creatureIcon.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.creatureIcon);
    this.creatureCount = this.game.make.text(0,0, "2", numberStyle);
    this.creatureCount.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.creatureCount);

    var colon = this.game.make.text(0,0, " : ", colonStyle);
    colon.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(colon);

    this.foodIcon = this.game.make.sprite(0, 0, "apple");
    this.foodIcon.scale.setTo(iconScale, iconScale);
    this.foodIcon.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.foodIcon);

    this.foodCount = this.game.make.text(0,0, "6", numberStyle);
    this.foodCount.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.foodCount, true);

    this.colon2 = this.game.make.text(0,0, " : ", colonStyle);
    this.colon2.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.colon2);

    this.foodIcon2 = this.game.make.sprite(0, 0, "apple");
    this.foodIcon2.scale.setTo(iconScale, iconScale);
    this.foodIcon2.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.foodIcon2);

    this.foodCount2 = this.game.make.text(0,0, "6", numberStyle);
    this.foodCount2.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.foodCount2, true);

    this.contentsContainer.x = 10;
    this.contentsContainer.y = this.bgCenter.height/2 + this.bgContainer.y;

    this.root.addChild(this.contentsContainer);

    this.messageText = this.game.make.text(0, 0, "Click/drag to resize", {font: "14pt EnzoBlack", fill: "#ffffff"});
    this.root.addChild(this.messageText);
    this.messageText.anchor.setTo(0.5, 1);

    GlassLab.SignalManager.update.add(this._onUpdate, this);
};

// Extends Sprite
GlassLab.UIRatioTooltip.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIRatioTooltip.prototype.constructor = GlassLab.UIRatioTooltip;

GlassLab.UIRatioTooltip.prototype.show = function(targetPen, message)
{
    this.pen = targetPen;
    this.message = message;

    if (!this.visible)
    {
        this.visible = true;

        GlassLab.SignalManager.penFoodTypeSet.add(this._onPenFoodTypeChanged, this);
        GlassLab.SignalManager.creatureTargetsChanged.add(this.Refresh, this);
        GlassLab.SignalManager.tilePenStateChanged.add(this._onTilePenStateChanged, this);
    }

    this.Refresh(message);

    // Now this is pretty hacky but I also don't want to duplicate all the functionality of figuring out what the mouse is over
    // Since we want to highlight the gate exactly when we want to show the popup with "Click to feed"
    if (this.pen.setGateHighlight) this.pen.setGateHighlight(message == "readyPen");

    this._refreshPosition();

    this.root.scale.y = 0;
    this.game.add.tween(this.root.scale).to({y: 1}, 600, Phaser.Easing.Elastic.Out, true);
};

GlassLab.UIRatioTooltip.prototype.Refresh = function(message)
{
    if (!this.pen._getCurrentCreatureType)
    {
        console.error("Tried to use UIRatioTooltip on pen that didn't know _getCurrentCreatureType");
        return;
    }

    // Update creature info
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.pen._getCurrentCreatureType());
    this.creatureIcon.visible = creatureInfo;
    if (creatureInfo) this.creatureIcon.loadTexture(creatureInfo.spriteName + "_sticker");
    //this.creatureIcon.loadTexture(creatureInfo ? creatureInfo.spriteName + "_sticker" : null);

    this.creatureCount.text = this.pen.widths[0]*this.pen.height; // TODO: Don't access internal unlabeled data directly

    // Update food info
    var foodInfo = GlassLab.FoodTypes[this.pen.foodTypes[0]];
    this.foodIcon.visible = foodInfo;
    if (foodInfo) this.foodIcon.loadTexture(foodInfo.spriteName + "_sticker");
    this.foodCount.text = this.pen.widths[1]*this.pen.height;

    // Update 2nd food info
    if (this.pen.widths[2])
    {
        var foodInfo = GlassLab.FoodTypes[this.pen.foodTypes[1]];
        this.foodIcon2.visible = foodInfo;
        if (foodInfo) this.foodIcon2.loadTexture(foodInfo.spriteName + "_sticker");
        this.foodCount2.text = this.pen.widths[2] * this.pen.height;

        // colon2.visible serves as check for whether 2nd type of food is already showing or not
        if (!this.colon2.visible)
        {
            this.contentsContainer.addManagedChild(this.colon2);
            this.contentsContainer.addManagedChild(this.foodIcon2);
            this.contentsContainer.addManagedChild(this.foodCount2);
            this.colon2.visible = this.foodIcon2.visible = this.foodCount2.visible = true;
        }
    }
    else if (this.colon2.visible) // If already showing, remove it so UITable doesn't try to sort
    {
        this.contentsContainer.removeManagedChild(this.colon2);
        this.contentsContainer.removeManagedChild(this.foodIcon2);
        this.contentsContainer.removeManagedChild(this.foodCount2);
        this.colon2.visible = this.foodIcon2.visible = this.foodCount2.visible = false;
    }

    this.contentsContainer._refresh();

    this.messageText.visible = message;
    if (message == "outerEdge") this.messageText.text = "Click/drag to resize";
    else if (message == "innerEdge") this.messageText.text = "Click/drag to change food ratio";
    else if (message == "readyPen") this.messageText.text = "Click to feed";

    this.bgLeft.loadTexture( this.messageText.visible? "penTooltipCapTall" : "penTooltipCap");
    this.bgRight.loadTexture( this.messageText.visible? "penTooltipCapTall" : "penTooltipCap");

    var contentWidth = this.contentsContainer.getWidth();
    if (this.messageText.visible) contentWidth = Math.max(contentWidth, this.messageText.width);
    this.bgCenter.width = contentWidth + this.padding * 2;
    this.bgCenter.height = this.bgLeft.height;
    this.bgContainer._refresh();

    this.bgContainer.y = this.arrow.y - this.bgContainer.getHeight();
    this.contentsContainer.y = this.bgContainer.y + (this.messageText.visible? 25 : 30);
    if (this.messageText.visible) this.messageText.y = this.arrow.y - 5;

    this.bgContainer.x = -this.bgContainer.getWidth()/2;
    this.contentsContainer.x = -this.contentsContainer.getWidth() / 2;
};

GlassLab.UIRatioTooltip.prototype._onTilePenStateChanged = function(pen, tile)
{
    this.checkInPenOnUpdate = true;
};

GlassLab.UIRatioTooltip.prototype._onPenFoodTypeChanged = function(pen, food)
{
    if (pen == this.pen)
    {
        this.Refresh();
    }
};

GlassLab.UIRatioTooltip.prototype._checkMouseOverPen = function()
{
    var currentPen = null;
    var message = null; // determines the message that's shown (outerEdge, innerEdge, readyPen)

    if (GLOBAL.dragTarget) {
        if (GLOBAL.dragTarget instanceof GlassLab.Edge) {
            currentPen = GLOBAL.dragTarget.pen;
            message = GLOBAL.dragTarget.getIsInnerEdge()? "innerEdge" : "outerEdge";
        }
        // Else, we're dragging something else, so don't show a tooltip
    } else if (GLOBAL.overTarget && GLOBAL.overTarget instanceof GlassLab.Edge) {
        currentPen = GLOBAL.overTarget.pen;
        message = GLOBAL.overTarget.getIsInnerEdge()? "innerEdge" : "outerEdge";
    } else {
        var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX,this.game.input.activePointer.worldY);
        this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
        var tileSprite = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        if (tileSprite && tileSprite.inPen && tileSprite.inPen instanceof GlassLab.FeedingPen) {
            currentPen = tileSprite.inPen;
            if (currentPen.canFeed && currentPen.getSection(tileSprite) > 0) message = "readyPen";
        }
    }

    /*if (currentPen) {
        if (this.pen != currentPen || this.message != message) this.show(currentPen, message);
    } else if (this.pen) this.hide();*/
    // everytime the thing we want to show changes, restart the countdown
    if (currentPen != this.desiredPen || message != this.desiredMessage) this.changeCountdown = this.changeDelay;
    this.desiredPen = currentPen;
    this.desiredMessage = message;
};

GlassLab.UIRatioTooltip.prototype.hide = function()
{
    // This is somewhat hacky - see previous comment on the subject in show()
    if (this.pen && this.pen.setGateHighlight) this.pen.setGateHighlight(false);

    this.pen = null;
    this.message = null;

    if (this.visible)
    {
        this.visible = false;

        GlassLab.SignalManager.penFoodTypeSet.remove(this._onPenFoodTypeChanged, this);
        GlassLab.SignalManager.creatureTargetsChanged.remove(this.Refresh, this);
        GlassLab.SignalManager.tilePenStateChanged.remove(this._onTilePenStateChanged, this);
    }
};

GlassLab.UIRatioTooltip.prototype._onUpdate = function(dt)
{
    this._checkMouseOverPen();

    if (this.changeCountdown > 0) {
        this.changeCountdown -= dt;
    }
    if (this.changeCountdown <= 0) {
        // Apply the desired changes
        if (this.desiredPen) {
            if (this.pen != this.desiredPen || this.message != this.desiredMessage) this.show(this.desiredPen, this.desiredMessage);
        } else if (this.pen) this.hide();
    }

    if (this.pen) this._refreshPosition();
};

GlassLab.UIRatioTooltip.prototype._refreshPosition = function()
{
    var pointer = this.game.input.activePointer;
    if (pointer)
    {
        this.x = pointer.x;// - this.bgContainer.getWidth()/2;
        this.y = pointer.y;
    }
};