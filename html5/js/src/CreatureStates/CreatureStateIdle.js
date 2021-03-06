/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateIdle
 */
GlassLab.CreatureStateIdle = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
};

GlassLab.CreatureStateIdle.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateIdle.constructor = GlassLab.CreatureStateIdle;

GlassLab.CreatureStateIdle.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.creature.draggableComponent.setActive(true);
    this.creature._clearPath();

    this.speed = this.creature.moveSpeed / 2;
};

GlassLab.CreatureStateIdle.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.StopAnim();
  if (this.findDestinationHandler)
  {
    this.game.time.events.remove(this.findDestinationHandler);
    this.findDestinationHandler = null;
  }
};

GlassLab.CreatureStateIdle.prototype._findNewDestination = function()
{
  var currentTile = this.creature.getTile();

  // Build list of possible movements
  var possibleTiles = [];
  for (var i=-3; i <= 3; i++)
  {
    for (var j=-3; j <= 3; j++)
    {
      if (j==0 && i == 0) continue;
      var tile = GLOBAL.tileManager.GetTile(currentTile.col + i, currentTile.row + j);
      if (tile && tile.getIsWalkable())
      {
          possibleTiles.push(tile);
      }
    }
  }

  if (possibleTiles.length > 0) {
    tile = possibleTiles[parseInt(Math.random() * possibleTiles.length)];
  }
  else tile = currentTile; // stay in place

  this._setNewDestination(tile);
};

GlassLab.CreatureStateIdle.prototype._setNewDestination = function(tile) {
  this.targetTile = tile;

  this.findDestinationHandler = null;

  if (GLOBAL.debug) tile.tint = 0x00ff00;
  this.creature.PathToTile(tile);
};

GlassLab.CreatureStateIdle.prototype.Update = function()
{
  if (this.findDestinationHandler) return; // still waiting to pick a new destination

  if (isNaN(this.creature.targetPosition.x) && this.creature.currentPath.length == 0)
  {
      this.findDestinationHandler = this.game.time.events.add(Math.random() * 4000, this._findNewDestination, this);
  }
  else
  {
    this.creature._move();
  }
};
