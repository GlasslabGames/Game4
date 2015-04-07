/**
 * Created by Rose Abernathy on 4/6/2015.
 */
var GlassLab = GlassLab || {};

/**
 * WorldObject - a thing like food or a creature that can be dragged around the world.
 */
GlassLab.WorldObject = function (game) {
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.game = game;

    this.sprite = game.make.sprite(0, 0, "taco");
    this.addChild(this.sprite);

    this.draggableComponent = new GlassLab.DraggableComponent(this);
};

// Extends Sprite
GlassLab.WorldObject.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.WorldObject.prototype.constructor = GlassLab.WorldObject;
