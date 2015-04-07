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

    this.sprite = game.make.sprite(0, 0, "taco");
    this.sprite.anchor.setTo(0.5, 0.5);
    this.addChild(this.sprite);

    this.draggableComponent = new GlassLab.DraggableComponent(game, this);
    this.draggableComponent.snap = true;

    this.draggableComponent.events.onDrag.add(this._onDrag, this);
    this.draggableComponent.events.onStartDrag.add(this._onStartDrag, this);
    this.draggableComponent.events.onEndDrag.add(this._onEndDrag, this);
};

// Extends Sprite
GlassLab.WorldObject.prototype = Object.create(Phaser.Plugin.Isometric.IsoSprite.prototype);
GlassLab.WorldObject.prototype.constructor = GlassLab.WorldObject;

GlassLab.WorldObject.prototype._onStartDrag = function () {
    this.game.add.tween(this.sprite).to({y: -60}, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.WorldObject.prototype._onEndDrag = function () {
    this.game.add.tween(this.sprite).to({y: 0}, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.WorldObject.prototype._onDrag = function (mousePos, diff) {
    this.game.iso.unproject(mousePos, mousePos);
    var dragDelayAmount = 0.7; // setting this to a higher number will make the object follow the mouse with more of a delay
    this.isoX = this.isoX * dragDelayAmount + mousePos.x * (1 - dragDelayAmount);
    this.isoY = this.isoY * dragDelayAmount + mousePos.y * (1 - dragDelayAmount);
};