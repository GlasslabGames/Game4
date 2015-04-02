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

    this.checkInPenOnUpdate = false;

    this.bgContainer = new GlassLab.UITable(game, 3, 0);
    var bgLeft = this.game.make.sprite(0,0,"penTooltipCap");
    this.bgContainer.addManagedChild(bgLeft);
    this.bgCenter = this.game.make.sprite(0,0,"penTooltipWidth");
    this.bgContainer.addManagedChild(this.bgCenter);
    var bgRight = this.game.make.sprite(0,0,"penTooltipCap");
    bgRight.scale.setTo(-1, 1);
    bgRight.anchor.setTo(1, 0);
    this.bgContainer.addManagedChild(bgRight, true);

    this.arrow = this.game.make.sprite(0,0,"questObjectiveArrow");
    this.arrow.scale.y = -1;
    this.arrow.anchor.setTo(.5, 1);
    this.arrow.x = this.bgContainer.getWidth()/2;
    this.arrow.y = this.bgContainer.getHeight();
    this.bgContainer.addChild(this.arrow);
    this.bgContainer.y = this.arrow.height - this.arrow.y; // Weird calculation because of negative scale

    bgLeft.alpha = this.bgCenter.alpha = bgRight.alpha = this.arrow.alpha = 0.75;
    this.bgCenter.tint = bgLeft.tint = bgRight.tint = this.arrow.tint = 0x000000;
    this.addChild(this.bgContainer);

    this.contentsContainer = new GlassLab.UITable(game, 8, 5);
    this.creatureIcon = this.game.make.sprite(0,0, "ram_art");
    this.creatureIcon.scale.setTo(-.2, .2);
    this.creatureIcon.anchor.setTo(1, .5);
    this.contentsContainer.addManagedChild(this.creatureIcon);
    this.creatureCount = this.game.make.text(0,0, "2", numberStyle);
    this.creatureCount.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.creatureCount);

    var colon = this.game.make.text(0,0, ":", colonStyle);
    colon.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(colon);

    this.foodIcon = this.game.make.sprite(0, 0, "apple");
    this.foodIcon.scale.setTo(.25, .25);
    this.foodIcon.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.foodIcon);

    this.foodCount = this.game.make.text(0,0, "6", numberStyle);
    this.foodCount.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.foodCount, true);

    this.colon2 = this.game.make.text(0,0, ":", colonStyle);
    this.colon2.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.colon2);

    this.foodIcon2 = this.game.make.sprite(0, 0, "apple");
    this.foodIcon2.scale.setTo(.25, .25);
    this.foodIcon2.anchor.setTo(0, .5);
    this.contentsContainer.addManagedChild(this.foodIcon2);

    this.foodCount2 = this.game.make.text(0,0, "6", numberStyle);
    this.foodCount2.anchor.setTo(0, .45);
    this.contentsContainer.addManagedChild(this.foodCount2, true);


    this.contentsContainer.x = 10;
    this.contentsContainer.y = this.bgCenter.height/2 + this.bgContainer.y;

    this.addChild(this.contentsContainer);
};

// Extends Sprite
GlassLab.UIRatioTooltip.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIRatioTooltip.prototype.constructor = GlassLab.UIRatioTooltip;

GlassLab.UIRatioTooltip.prototype.Show = function(targetPen)
{
    this.pen = targetPen;

    if (!this.visible)
    {
        this.visible = true;

        GlassLab.SignalManager.update.add(this._onUpdate, this);
        GlassLab.SignalManager.penFoodTypeSet.add(this._onPenFoodTypeChanged, this);
        GlassLab.SignalManager.creatureTargetsChanged.add(this.Refresh, this);
        GlassLab.SignalManager.tilePenStateChanged.add(this._onTilePenStateChanged, this);
    }

    this.Refresh();

    this._refreshPosition();

    this.scale.y = 0;
    this.game.add.tween(this.scale).to({y: 1}, 600, Phaser.Easing.Elastic.Out, true);
};

GlassLab.UIRatioTooltip.prototype.Refresh = function()
{
    // Update creature info
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.pen._getCurrentCreatureType());
    this.creatureIcon.loadTexture(creatureInfo ? creatureInfo.spriteName + "_art" : null);
    this.creatureCount.text = this.pen.widths[0]*this.pen.height; // TODO: Don't access internal unlabeled data directly

    // Update food info
    this.foodIcon.loadTexture(this.pen.foodTypes[0]);
    this.foodCount.text = this.pen.widths[1]*this.pen.height;

    // Update 2nd food info
    if (this.pen.widths[2])
    {
        this.foodIcon2.loadTexture(this.pen.foodTypes[1]);
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

    this.bgCenter.width = this.contentsContainer.getWidth() + this.padding*2;
    this.bgContainer._refresh();

    this.arrow.x = this.bgContainer.getWidth()/2;
    this.arrow.y = this.bgContainer.getHeight();
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
    this.checkInPenOnUpdate = false;
    var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX,this.game.input.activePointer.worldY);
    this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
    Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
    var tileSprite = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
    if (tileSprite)
    {
        if (!tileSprite.inPen)
        {
            this.Hide();
        }
        else
        {
            this.Show(tileSprite.inPen);
        }
    }
    else
    {
        this.Hide();
    }
};

GlassLab.UIRatioTooltip.prototype.Hide = function()
{
    this.pen = null;

    if (this.visible)
    {
        this.visible = false;

        GlassLab.SignalManager.update.remove(this._onUpdate, this);
        GlassLab.SignalManager.penFoodTypeSet.remove(this._onPenFoodTypeChanged, this);
        GlassLab.SignalManager.creatureTargetsChanged.remove(this.Refresh, this);
        GlassLab.SignalManager.tilePenStateChanged.remove(this._onTilePenStateChanged, this);
    }
};

GlassLab.UIRatioTooltip.prototype._onUpdate = function(dt)
{
    this._refreshPosition();
    if (this.checkInPenOnUpdate)
    {
        this._checkMouseOverPen();
    }
};

GlassLab.UIRatioTooltip.prototype._refreshPosition = function()
{
    var pointer = this.game.input.activePointer;
    if (pointer)
    {
        this.x = pointer.x - this.bgContainer.getWidth()/2;
        this.y = pointer.y;
    }
};