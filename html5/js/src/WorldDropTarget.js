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

    GlassLab.SignalManager.update.add(this._onUpdate, this);
};

// Extends Sprite
GlassLab.WorldDropTarget.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.WorldDropTarget.prototype.constructor = GlassLab.WorldDropTarget;

GlassLab.WorldDropTarget.prototype._onUpdate = function() {
  if (this.visible) {
      this.ring.angle += 1.5;
      var cursorPos = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
      Phaser.Point.divide(cursorPos, GLOBAL.WorldLayer.scale, cursorPos);
      this.x = cursorPos.x;
      this.y = cursorPos.y;
  }
};
