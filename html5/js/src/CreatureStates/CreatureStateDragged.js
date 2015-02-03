/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  console.log(this.creature,"dragged");
};

GlassLab.CreatureStateDragged.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateDragged.constructor = GlassLab.CreatureStateDragged;

GlassLab.CreatureStateDragged.prototype.Update = function()
{
  var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
  this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
  Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
  this.creature.sprite.isoX = cursorIsoPosition.x;
  this.creature.sprite.isoY = cursorIsoPosition.y;
};
