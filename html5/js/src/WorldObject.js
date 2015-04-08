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

    // this.addChild(game.make.graphics().beginFill(0xffffff,0.5).drawCircle(0, 0, 200)); // for debugging

    this.shadow = game.make.sprite();
    this.shadow.anchor.setTo(0.5, 0.5);
    this.shadow.tint = 0x000000;
    this.shadow.alpha = 0.3;
    this.addChild(this.shadow);

    this.baseOffsetWhileDragging = -25;
    this.floatHeight = -60;

    this.sprite = game.make.sprite();
    this.sprite.y = this.sprite.height / 2;
    this.sprite.anchor.setTo(0.5, 1);
    this.addChild(this.sprite);

    this.spriteY = this.sprite.y;
    this.shadowY = this.shadow.y;

    this.tweenTime = 100;

    this.draggableComponent = new GlassLab.DraggableComponent(game, this);
    this.draggableComponent.snap = true;
    this.draggableComponent.showDropTarget = true;

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
};

GlassLab.WorldObject.prototype._onEndDrag = function () {
    if (this.lastMousePos) {
        this.isoX = this.lastMousePos.x;
        this.isoY = this.lastMousePos.y;
    }
    this.game.add.tween(this.shadow).to({alpha: 0.3}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.shadow).to({y: this.shadowY}, this.tweenTime, Phaser.Easing.Quadratic.In, true);
    this.game.add.tween(this.sprite).to({y: this.spriteY}, this.tweenTime, Phaser.Easing.Quadratic.In, true);
    this.game.add.tween(this.sprite.scale).to({y: 0.8}, this.tweenTime, Phaser.Easing.Quadratic.InOut, true, this.tweenTime * 0.8, 0, true);
};

GlassLab.WorldObject.prototype._onDrag = function (mousePos, diff) {
    var inertia = 0.75; // setting this to a higher number will make the object follow the mouse with more of a delay
    this.game.iso.unproject(mousePos, mousePos);
    this.isoX = this.isoX * inertia + mousePos.x * (1 - inertia);
    this.isoY = this.isoY * inertia + mousePos.y * (1 - inertia);
    this.lastMousePos = mousePos;
};

GlassLab.WorldObject.prototype.snapToMouse = function () {
    var mousePos = this.draggableComponent.getCurrentMousePos(true);
    this.game.iso.unproject(mousePos, mousePos);
    this.isoX = mousePos.x;
    this.isoY = mousePos.y;
    this.lastMousePos = mousePos;
};