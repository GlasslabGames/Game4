/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateIdle
 */
GlassLab.CreatureStateIdle = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);

  this.targetPosition = new Phaser.Point();
  this.targetIsoPoint = new Phaser.Plugin.Isometric.Point3();
  this.findDestinationTimer = null;
};

GlassLab.CreatureStateIdle.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateIdle.constructor = GlassLab.CreatureStateIdle;

GlassLab.CreatureStateIdle.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.targetsChangedHandler = GlassLab.SignalManager.creatureTargetsChanged.add(this.creature._onTargetsChanged, this.creature);
  this.findDestinationHandler = this.game.time.events.add(Math.random()*3000 + 2000, this._findNewDestination, this);
  this.creature.draggable = true;
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
  if (this.targetsChangedHandler) this.targetsChangedHandler.detach();
};

GlassLab.CreatureStateIdle.prototype._findNewDestination = function()
{
  var currentTile = GLOBAL.tileManager.GetTileAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY);

  // Build list of possible movements
  var possibleTiles = [];
  var tile = GLOBAL.tileManager.GetTile(currentTile.col - 1, currentTile.row);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col + 1, currentTile.row);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row - 1);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row + 1);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  if (possibleTiles.length > 0) {
    tile = possibleTiles[parseInt(Math.random() * possibleTiles.length)];
  }
  else tile = currentTile; // stay in place

  this.targetPosition.set(tile.isoX, tile.isoY);

  this.findDestinationHandler = null;

  var flip = tile.isoY == this.creature.sprite.isoY;
  //console.log(tile.isoX, tile.isoY, this.creature.sprite.isoX, this.creature.sprite.isoY, flip);
  this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (flip ? -1 : 1);

  if (tile.isoY < this.creature.sprite.isoY || tile.isoX < this.creature.sprite.isoX) this.creature.PlayAnim('walk_back', true);
  else this.creature.PlayAnim('walk', true);

};

GlassLab.CreatureStateIdle.prototype.Update = function()
{
  if (this.findDestinationHandler) return; // still waiting to pick a new destination

  var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.isoPosition);
  if (delta.getMagnitudeSq() > 1) {
    delta.setMagnitude(1);
  }
  else {
    // If the delta magnitude is less than our move speed, we're done after this frame.
    this.creature.StopAnim();
    this.findDestinationHandler = this.game.time.events.add(Math.random() * 3000 + 2000, this._findNewDestination, this);
    // Physics
    if (this.creature.sprite.body) {
      this.creature.sprite.body.velocity.setTo(0, 0);
      return;
    }
  }

  var debugPoint = this.game.iso.project(delta);

  if (this.creature.sprite.body) {
    // Physics
    this.creature.sprite.body.velocity.x = delta.x * 100.0;
    this.creature.sprite.body.velocity.y = delta.y * 100.0;
  }
  else {
    Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);

    //this.creature.sprite.position = delta;
    this.creature.sprite.isoX = delta.x;
    this.creature.sprite.isoY = delta.y;
  }

  debugPoint = this.game.iso.project(this.targetIsoPoint);
  this.creature.debugAILine.setTo(this.creature.sprite.x, this.creature.sprite.y, debugPoint.x, debugPoint.y);
};
