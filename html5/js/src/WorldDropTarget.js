/**
 * Created by Rose Abernathy on 4/6/2015.
 */
var GlassLab = GlassLab || {};

/**
 * WorldDropTarget - the animated target that appears while you're dragging a creature or food around the world
 */
GlassLab.WorldDropTarget = function (game) {
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.game = game;

    var container = game.make.sprite();
    this.addChild(container);
    container.scale.setTo(1, 0.515);
    container.alpha = 0.5;

    var ring = game.make.sprite(0, 0, "dropTargetRing");
    ring.anchor.setTo(0.5, 0.5);
    container.addChild(ring);
    this.ring = ring;

    var x = game.make.sprite(0, 0, "dropTargetX");
    x.anchor.setTo(0.5, 0.5);
    container.addChild(x);

    this.active = false;
    this.scale.setTo(0, 0);

    GlassLab.SignalManager.update.add(this._onUpdate, this);
};

// Extends Sprite
GlassLab.WorldDropTarget.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.WorldDropTarget.prototype.constructor = GlassLab.WorldDropTarget;

GlassLab.WorldDropTarget.prototype._onUpdate = function() {
    var target = (GLOBAL.dragTarget);// && GLOBAL.dragTarget instanceof GlassLab.WorldObject);
    if (target && !this.active) {
        this.active = true;
        this.scale.setTo(0,0);
        this.game.add.tween(this.scale).to({x: 1, y: 1}, 100, Phaser.Easing.Quadratic.InOut, true);
    } else if (!target && this.active) {
        this.active = false;
        this.game.add.tween(this.scale).to({x: 0, y: 0}, 100, Phaser.Easing.Quadratic.InOut, true);
    }

    if (this.active) {
      this.ring.angle += 1.5;
      var cursorPos = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
      Phaser.Point.divide(cursorPos, GLOBAL.WorldLayer.scale, cursorPos);
      this.x = cursorPos.x;
      this.y = cursorPos.y;
    }
};
