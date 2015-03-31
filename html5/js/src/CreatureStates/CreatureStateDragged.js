/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  //console.log(this.creature,"dragged");
};

GlassLab.CreatureStateDragged.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateDragged.constructor = GlassLab.CreatureStateDragged;

GlassLab.CreatureStateDragged.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.PlayAnim('walk', true, this.creature.baseAnimSpeed * 4);
  this.creature.shadow.y = 150;

    this.creature.draggableComponent.events.onDrag.add(this._onDrag, this);
};

GlassLab.CreatureStateDragged.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  var tile = this.creature.getTile();
  this.creature.setIsoPos(tile.isoX, tile.isoY);

    this.creature.StopAnim();
  //var offset = (); // offset by the shadow position
  this.creature.shadow.y = 0;

    this.creature.draggableComponent.events.onDrag.remove(this._onDrag, this);

};


GlassLab.CreatureStateDragged.prototype._onDrag = function(movement) {
    var isoPos = this.game.iso.unproject(movement);
    isoPos.x *= this.creature.sprite.scale.x;
    isoPos.y *= this.creature.sprite.scale.y;
    this.creature.sprite.isoX += isoPos.x;
    this.creature.sprite.isoY += isoPos.y;
};
