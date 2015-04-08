/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateEmoting
 */
GlassLab.CreatureStateEmoting = function(game, owner, happy, callback)
{
  GlassLab.CreatureState.call(this, game, owner);
    this.happy = happy;
    this.callback = callback;
};

GlassLab.CreatureStateEmoting.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEmoting.constructor = GlassLab.CreatureStateEmoting;

GlassLab.CreatureStateEmoting.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.showEmote(this.happy, this.callback);
};

GlassLab.CreatureStateEmoting.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  //this.creature._afterEmote();
};