/**
 * Created by Rose Abernathy on 2/3/2015.
 */
/**
 * CreatureStateTraveling - when it's heading for a certain target (for now, a target tile, although it could be reworked)
 */
GlassLab.CreatureStateTraveling = function(game, owner, targetTile)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.target = targetTile;
};

GlassLab.CreatureStateTraveling.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateTraveling.constructor = GlassLab.CreatureStateTraveling;

GlassLab.CreatureStateTraveling.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.targetsChangedHandler = GlassLab.SignalManager.creatureTargetsChanged.add(this.creature._onTargetsChanged, this.creature);
  this.creature.draggable = true;
};

GlassLab.CreatureStateTraveling.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.StopAnim();
  if (this.wayPoint && this.wayPoint != this.creature.prevTile) this.wayPoint.onCreatureExit(this.creature); // make sure that tile stops thinking we're entering it
  if (this.targetsChangedHandler) this.targetsChangedHandler.detach();
};

GlassLab.CreatureStateTraveling.prototype.Update = function() {
  if (!this.wayPoint) {
    this.wayPoint = this._getWaypoint();
    this.wayPoint.onCreatureEnter(this.creature); // mark that tile as occupied since we're about to enter it
  }

  var delta = Phaser.Point.subtract(this.wayPoint.isoPosition, this.creature.sprite.isoPosition);
  var moveSpeed = 2;
  if (delta.getMagnitudeSq() >= moveSpeed * moveSpeed) { // move in the right direction, but no faster than our move speed
    // Collapse one the smaller direction so we stay on the grid (if they're equal, resolve it randomly)
    if (Math.abs(delta.x) < Math.abs(delta.y) || (Math.abs(delta.x) == Math.abs(delta.y) && Math.random() > 0.5)) delta.x = 0;
    else delta.y = 0;
    delta.setMagnitude( moveSpeed );
    this.creature.sprite.isoX += delta.x;
    this.creature.sprite.isoY += delta.y;

    // Note that the animation won't start if we're already playing it, so this is no problem
    if (delta.y < 0 || delta.x < 0) {
      this.creature.PlayAnim("walk_back", true, 144);
    } else {
      this.creature.PlayAnim("walk", true, 144);
    }
    var flip = (delta.y == 0);
    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (flip ? -1 : 1);
  } else {
    this.creature.StopAnim();
    // If the waypoint is the same as the original target point, stop
    if (Phaser.Point.subtract(this.wayPoint.isoPosition, this.target.isoPosition).getMagnitude() < GLOBAL.tileSize) {
      console.log("Reached target point");
      if (this.target.inPen) {
        console.log(this.target.inPen);
        this.creature.pen = this.target.inPen;
        this.target.inPen.onCreatureEntered(this.creature);
        this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
      } else {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this.creature));
      }
    } else {
      this.wayPoint = null; // so we recalculate it next time
    }
  }

};

GlassLab.CreatureStateTraveling.prototype._getWaypoint = function() {
  var delta = Phaser.Point.subtract(this.target.isoPosition, this.creature.sprite.isoPosition);
  var currentTile = this.creature.getTile();
  var xTile = GLOBAL.tileManager.GetTile(currentTile.col + (delta.x < 0? -1 : 1), currentTile.row);
  var yTile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row + (delta.y < 0? -1 : 1));
  // Go in the y direction if the y diff is larger (or randomly if they're the same), but only if we can walk there
  var preferY = (Math.abs(delta.x) < Math.abs(delta.y) || (Math.abs(delta.x) == Math.abs(delta.y) && Math.random() > 0.5));
  if ((preferY || !xTile.getIsWalkable(this.creature.type)) && yTile.getIsWalkable(this.creature.type)) { // go this way if we prefer it or if the other way is blocked
    return yTile;
  } else if (xTile.getIsWalkable(this.creature.type)) {
    return xTile;
  } else return currentTile; // stay in place for now
};