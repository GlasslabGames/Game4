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
  this.creature.PlayAnim('walk', true, this.creature.baseAnimSpeed * 5);
};

GlassLab.CreatureStateDragged.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
    this.creature.StopAnim();

};