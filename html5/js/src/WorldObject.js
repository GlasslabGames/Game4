/**
 * Created by Rose Abernathy on 4/6/2015.
 */
var GlassLab = GlassLab || {};

/**
 * WorldObject - a thing like food or a creature that can be dragged around the world.
 */
GlassLab.WorldObject = function (game) {
    Phaser.Plugin.Isometric.IsoSprite.prototype.constructor.call(this, game);
    this.game = game;

    this.shadow = game.make.sprite();
    this.shadow.anchor.setTo(0.5, 0.5);
    this.shadow.tint = 0x000000;
    this.shadow.alpha = 0.3;
    this.addChild(this.shadow);

    this.baseOffsetWhileDragging = 0;
    this.floatHeight = -60;

    this.sprite = game.make.sprite();
    this.sprite.anchor.setTo(0.5, 1);
    this.addChild(this.sprite);

    //this.addChild(game.make.graphics().beginFill(0x0000ff,1).drawCircle(0, 0, 20)); // for debugging

    // We want to have these values set here to be sure that we stick to the correct position scale even if we're interrupted in the middle of a tween, etc
    this.spriteY = this.sprite.y;
    this.shadowY = this.shadow.y;
    this.spriteScaleY = 1;

    this.canDropInPen = false; // excluding the waiting area - should be set to true for food
    this.canDropInWaitingArea = false; // should be set to true for creatures
    this.destroyIfOutOfBounds = false; // if we're willing to destroy the object if it gets dragged out of bounds (false for creatures, true for food)
    this.tweenTime = 100;

    this.draggableComponent = new GlassLab.DraggableComponent(game, this);
    this.draggableComponent.snap = true;
    this.draggableComponent.showDropTarget = true;

    this.input.priorityID = 5; // above the base pen, but below the edges of the pen

    this.draggableComponent.events.onDrag.add(this._onDrag, this);
    this.draggableComponent.events.onStartDrag.add(this._onStartDrag, this);
    this.draggableComponent.events.onEndDrag.add(this._onEndDrag, this);
};

// Extends isosprite
GlassLab.WorldObject.prototype = Object.create(Phaser.Plugin.Isometric.IsoSprite.prototype);
GlassLab.WorldObject.prototype.constructor = GlassLab.WorldObject;

GlassLab.WorldObject.prototype.getGlobalPos = function() {
    return GlassLab.Util.GetGlobalIsoPosition(this);
};

GlassLab.WorldObject.prototype.getTile = function() {
    var globalPosition = this.getGlobalPos();
    return GLOBAL.tileManager.GetTileAtIsoWorldPosition(globalPosition.x, globalPosition.y);
};

GlassLab.WorldObject.prototype._onStartDrag = function () {
    this.game.add.tween(this.shadow).to({y: this.shadowY+this.baseOffsetWhileDragging}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.sprite).to({y: this.spriteY+this.baseOffsetWhileDragging+this.floatHeight}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.shadow).to({alpha: 0.15}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true);

    this.target = null;
};

GlassLab.WorldObject.prototype._onEndDrag = function () {
    if (this.target) {
        this.isoX = this.target.x;
        this.isoY = this.target.y;
    }
    if (!this.canDropOn(this.getTile())) { // tried to drop in an invalid place
        if (this.destroyIfOutOfBounds) {
            this.destroyed = true; // we need to check this in later functions
            this.destroy();
            return;
        } else { // revert to the previous position and hope for the best
            this.isoX = this.draggableComponent.dragStartPoint.x;
            this.isoY = this.draggableComponent.dragStartPoint.y;
        }
    }

    this.game.add.tween(this.shadow).to({alpha: 0.3}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.shadow).to({y: this.shadowY}, this.tweenTime, Phaser.Easing.Quadratic.In, true);
    this.game.add.tween(this.sprite).to({y: this.spriteY}, this.tweenTime, Phaser.Easing.Quadratic.In, true);
    this.game.add.tween(this.sprite.scale).to({y: this.spriteScaleY * 0.8}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true, this.tweenTime * 0.8, 0, true);
};

GlassLab.WorldObject.prototype._onDrag = function (mousePos, diff) {
    var inertia = 0.75; // setting this to a higher number will make the object follow the mouse with more of a delay

    // the drop target does some calculations to avoid going out of bounds, so we should follow it if possible
    if (GLOBAL.dropTarget.active) mousePos = GLOBAL.dropTarget.position;

    this.target = this.game.iso.unproject(mousePos);
    this.isoX = this.isoX * inertia + this.target.x * (1 - inertia);
    this.isoY = this.isoY * inertia + this.target.y * (1 - inertia);
};

GlassLab.WorldObject.prototype.canDropOn = function (tile) {
    if (!tile) return false;
    else if (tile.inPen) {  // check which section of the pen we're in. Even if a tile wouldn't be walkable, we might allow it if it's in the correct part of the pen.
        var section = tile.inPen.getSection(tile);
        if (section == 0 && this.canDropInWaitingArea) return true;
        else if (section > 0 && this.canDropInPen) return true;
        else return false;
    }
    return tile.getIsWalkable();
};

GlassLab.WorldObject.prototype.snapToMouse = function () {
    var mousePos = this.draggableComponent.getCurrentMousePos(true);
    this.game.iso.unproject(mousePos, mousePos);
    this.isoX = mousePos.x;
    this.isoY = mousePos.y;
};

GlassLab.WorldObject.prototype.placeOnTile = function (col, row) {
    // offset a little so it looks better in the pen
    this.isoX = (col + 0.5) * GLOBAL.tileSize;
    this.isoY = (row + 0.5) * GLOBAL.tileSize;
};