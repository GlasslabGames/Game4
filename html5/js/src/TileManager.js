/**
 * Created by Jerry Fu on 1/15/2015.
 */


var GlassLab = GlassLab || {};

// Requires phaser

GlassLab.TileManager = function(game)
{
    this.game = game;
    this.mapData = [[]]; // array of tile type numbers
    this.map = [[]]; // array of sprites
    this.centerTile = {x: 0, y: 0};
    this.tileSize = 1;
};

GlassLab.TileManager.prototype.TryGetTileData = function(x, y)
{
    if (x < 0 || x >= this.mapData.length || y < 0 || y >= this.mapData[x].length) return null;

    return this.GetTileData(x, y);
};

GlassLab.TileManager.prototype.GetTileData = function(x, y)
{
    return this.mapData[x][y];
};

GlassLab.TileManager.prototype.GetTile = function(x, y)
{
    return (this.map[x])? this.map[x][y] : null;
};

GlassLab.TileManager.prototype.GetMapHeight = function()
{
    return this.map.length;
};

GlassLab.TileManager.prototype.GetMapWidth = function()
{
    return this.map[0].length;
};

GlassLab.TileManager.prototype.IsTileTypeWalkable = function(type)
{
    return type && type != GlassLab.Tile.TYPES.water; // maybe move this to Tile? or give the tile types some properties?
};

GlassLab.TileManager.prototype.GenerateRandomMapData = function(width, height, min, max)
{
    for (var i=0; i < width; i++)
    {
        for (var j=0; j < height; j++)
        {
            if (!this.mapData[i]) this.mapData[i] = [];
            var centerDist = Math.sqrt( (j - height / 2.0)*(j - height / 2.0) + (i - width / 2.0) * (i - width / 2.0));
            if (centerDist > 8.5) this.mapData[i][j] = GlassLab.Tile.TYPES.water; // water
            else if (Math.random() < 0.75) this.mapData[i][j] = GlassLab.Tile.TYPES.grass;
            else this.mapData[i][j] = GlassLab.Tile.TYPES["mushroom"+ Math.floor(Math.random() * 3)];
        }
    }
/* This made a fence
    this.mapData[10][6] = 6; // Right corner
    this.mapData[10][7] = 6;
    this.mapData[10][8] = 6;
    this.mapData[10][9] = 6; // Bottom corner
    this.mapData[6][6] = 6; // Top corner
    this.mapData[6][7] = 6;
    this.mapData[6][8] = 6;
    this.mapData[6][9] = 6; // Left corner
    this.mapData[7][9] = 6;
    this.mapData[8][9] = 6;
    this.mapData[9][9] = 6;
    this.mapData[7][6] = 6;
    this.mapData[8][6] = 6;
    this.mapData[9][6] = 6;
   */
};

GlassLab.TileManager.prototype.GenerateMapFromDataToGroup = function(parentGroup)
{
    function isFence(num) { return num >= 5 && num <= 8; }
    for (var i=this.mapData.length-1; i>=0; i--)
    {
        for (var j=this.mapData[i].length-1; j>=0; j--)
        {
            var tileType = this.GetTileData(i, j);
            var shouldFlip = false;
            if (isFence(tileType)) // we're not using this at all :/
            {
                if (isFence(this.mapData[i+1][j])) // right-down
                {
                    if (isFence(this.mapData[i-1][j])) // -
                    {
                        tileType = 6;
                        shouldFlip = true;
                    }
                    else if (isFence(this.mapData[i][j+1])) // ^
                    {
                        tileType = 8;
                    }
                    else if (isFence(this.mapData[i][j-1])) // <
                    {
                        tileType = 7;
                    }
                }
                else if (isFence(this.mapData[i-1][j])) // left-top
                {
                    if (isFence(this.mapData[i+1][j])) // -
                    {
                        tileType = 6;
                        shouldFlip = true;
                    }
                    else if (isFence(this.mapData[i][j+1])) // >
                    {
                        tileType = 7;
                        shouldFlip = true;
                    }
                    else if (isFence(this.mapData[i][j-1])) // v
                    {
                        tileType = 5;
                    }
                }
                else if (isFence(this.mapData[i][j+1])) // left-down
                {
                    if (isFence(this.mapData[i][j-1])) // -
                    {
                        tileType = 6;
                    }
                    else if (isFence(this.mapData[i+1][j])) // ^
                    {
                        tileType = 8;
                    }
                    else if (isFence(this.mapData[i-1][j])) // v
                    {
                        tileType = 5;
                    }
                }
                else if (isFence(this.mapData[i][j-1])) // right-top
                {
                    if (isFence(this.mapData[i][j+1])) // -
                    {
                        tileType = 6;
                    }
                    else if (isFence(this.mapData[i+1][j])) // <
                    {
                        tileType = 7;
                    }
                    else if (isFence(this.mapData[i-1][j])) // v
                    {
                        tileType = 5;
                    }
                }
            }

            var image = new GlassLab.Tile(this.game, i, j, tileType);
            if (shouldFlip) image.scale.x = -image.scale.x;
            parentGroup.add(image);

            if (!this.map[i]) this.map[i] = [];
            this.map[i][j] = image;

            if (GLOBAL.debug)
            {
                var text = this.game.make.text(0,0, "(" + i + ", " + j + ")");
                text.anchor.set(0.5, 0.5);
                image.addChild(text);
                if (image.scale.x < 0)
                {
                    text.scale.x = -text.scale.x;
                }
            }
        }
    }

    // Sort tile render order
    this.game.iso.simpleSort(parentGroup);
};

GlassLab.TileManager.prototype.SetCenter = function(x, y)
{
    this.centerTile.x = x;
    this.centerTile.y = y;
};

GlassLab.TileManager.prototype.SetTileSize = function(size)
{
    this.tileSize = size;
};

GlassLab.TileManager.prototype.GetTileWorldPosition = function(indexX, indexY, out)
{
    var worldX = (indexX - this.centerTile.x) * this.tileSize;
    var worldY = (indexY - this.centerTile.y) * this.tileSize;

    if (out)
    {
        out.setTo(worldX, worldY);
    }
    else
    {
        return new Phaser.Point(worldX, worldY);
    }
};

GlassLab.TileManager.prototype.GetTileIndexAtWorldPosition = function(x, y, out)
{
    var tileX = parseInt(Math.round(x / this.tileSize)) + this.centerTile.x;
    var tileY = parseInt(Math.round(y / this.tileSize)) + this.centerTile.y;

    if (out && out.setTo)
    {
        out.setTo(tileX, tileY);
    }
    else
    {
        return new Phaser.Point(tileX, tileY);
    }
};

GlassLab.TileManager.prototype.GetTileDataAtWorldPosition = function(x, y)
{
    var tilePosition = this.GetTileIndexAtWorldPosition(x,y);
    return this.GetTileData(tilePosition.x, tilePosition.y);
};

GlassLab.TileManager.prototype.GetTileAtIsoWorldPosition = function(x, y)
{
    var tilePosition = this.GetTileIndexAtWorldPosition(x,y);
    return this.GetTile(tilePosition.x, tilePosition.y);
};
GlassLab.TileManager.prototype.GetTileAtWorldPosition = function(x, y)
{
    var isoPosition = this.game.iso.unproject(new Phaser.Point(x,y));
    Phaser.Point.divide(isoPosition, GLOBAL.WorldLayer.scale, isoPosition);
    var tilePosition = this.GetTileIndexAtWorldPosition(isoPosition.x, isoPosition.y);
    return this.GetTile(tilePosition.x, tilePosition.y);
};

GlassLab.TileManager.prototype.TryGetTileAtIsoWorldPosition = function(x, y)
{
    var tilePosition = this.GetTileIndexAtWorldPosition(x,y);
    if (tilePosition.x < 0 || tilePosition.x >= this.map.length || tilePosition.y < 0 || tilePosition.y >= this.map[0].length) return null;

    return this.GetTile(tilePosition.x, tilePosition.y);
};

GlassLab.TileManager.prototype.TryGetTileAtWorldPosition = function(x, y)
{
    var isoPosition = this.game.iso.unproject(new Phaser.Point(x,y));
    Phaser.Point.divide(isoPosition, GLOBAL.WorldLayer.scale, isoPosition);
    var tilePosition = this.GetTileIndexAtWorldPosition(isoPosition.x, isoPosition.y);
    if (tilePosition.x < 0 || tilePosition.x >= this.map.length || tilePosition.y < 0 || tilePosition.y >= this.map[0].length) return null;

    return this.GetTile(tilePosition.x, tilePosition.y);
};

GlassLab.TileManager.prototype.clearPenTiles = function()
{
  for (var col = 0; col < this.GetMapWidth(); col++) {
    for (var row = 0; row < this.GetMapHeight(); row++) {
      var tile = this.GetTile(col, row);
      tile.setInPen(false);
      tile.unswapType();
    }
  }
};

GlassLab.TileManager.prototype.clearTiles = function()
{
  for (var col = 0; col < this.GetMapWidth(); col++) {
    for (var row = 0; row < this.GetMapHeight(); row++) {
      var tile = this.GetTile(col, row);
      tile.setInPen(false);
      tile.unswapType();
      tile.occupant = null;
        tile.food = null;
    }
  }

    for (var i = GLOBAL.foodLayer.children.length-1; i>=0; i--) {
        GLOBAL.foodLayer.getChildAt(i).destroy();
    }
};

GlassLab.TileManager.prototype.getRandomWalkableTile = function() {
  var randCol = parseInt(Math.random() * this.GetMapWidth());
  var randRow = parseInt(Math.random() * this.GetMapHeight());
  var targetTile = this.GetTile(randCol, randRow);
  var n = 0;
  while (!targetTile.getIsWalkable() && n++ < 3000) // safeguard against infinite loops
  {
    randCol = parseInt(Math.random() * this.GetMapWidth());
    randRow = parseInt(Math.random() * this.GetMapHeight());
    targetTile = this.GetTile(randCol, randRow);
  }
  return targetTile;
};

GlassLab.TileManager.prototype.getTargets = function(creature)
{
  var tiles = [];
  for (var col = 0; col < this.GetMapWidth(); col++) {
    for (var row = 0; row < this.GetMapHeight(); row++) {
      var tile = this.GetTile(col, row);
      if (tile.isTarget(creature)) tiles.push(tile);
    }
  }
  return tiles;
};


/**
 * Tile
 */
GlassLab.Tile = function(game, col, row, type) {
  Phaser.Plugin.Isometric.IsoSprite.prototype.constructor.call(this, game, (col-10)*GLOBAL.tileSize, (row-10)*GLOBAL.tileSize, 0, type);
  this.type = type;
  //this.tint = Phaser.Color.getColor(Math.random() * 255, Math.random() * 255, Math.random() * 255); // for testing with clearly distinguished tiles (change type to placeholderTile)
  this.anchor.setTo(0.5, 0.5);
  this.col = col;
  this.row = row;
  this.inPen = null;
  this.food = null;
  this.occupant = null; // current creature walking here
};

// Extends Isosprite
GlassLab.Tile.prototype = Object.create(Phaser.Plugin.Isometric.IsoSprite.prototype);
GlassLab.Tile.prototype.constructor = Phaser.Tile;

GlassLab.Tile.TYPES = {
  water : "grassTile0",
  grass : "grassTile4",
  mushroom0 : "grassTile3",
  mushroom1 : "grassTile1",
  mushroom2 : "grassTile2",
  dirt : "dirtTile"
};

GlassLab.Tile.prototype.swapType = function(newType) {
  if (this.type == newType) return;
  this.prevType = this.type;
  this.type = newType;
  this.loadTexture( newType );
};

GlassLab.Tile.prototype.unswapType = function() {
  if (!this.prevType) return;
  this.type = this.prevType;
  this.prevType = null;
  this.loadTexture( this.type );
};

GlassLab.Tile.prototype.isTarget = function(creature) {
  if (this.occupant && this.occupant != creature) return false; // nope, someone's here already
  else if (this.targetCreatureType == creature.type && !this.inPen.feeding) return true; // yes, this is a target pen slot
  else if (this.food && creature.desiredAmountsOfFood && (this.food.type in creature.desiredAmountsOfFood)) return true; // yes, there's food we want here
  else return false; // boring
};

GlassLab.Tile.prototype.setInPen = function(pen, targetCreatureType) {
  this.inPen = pen;
  this.targetCreatureType = pen && targetCreatureType;
};


GlassLab.Tile.prototype.onCreatureEnter = function(creature) {
  if (this.occupant) return;
  this.occupant = creature;
  if (this.isTarget(creature.type)) creature.enterPen(this.inPen);
};

GlassLab.Tile.prototype.onCreatureExit = function(creature) {
  if (this.occupant == creature) this.occupant = null;
};

GlassLab.Tile.prototype.onFoodAdded = function(food) {
  this.food = food;
  GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

GlassLab.Tile.prototype.onFoodRemoved = function(food) {
  if (this.food == food) {
    this.food = null;
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
  }
};

GlassLab.Tile.prototype.getIsWalkable = function(creatureType) {
  if (this.type == GlassLab.Tile.TYPES.water || this.occupant) return false;
  else if (creatureType && this.targetCreatureType == creatureType) return true; // allow walking in pen if the creature type matches
  else return !this.inPen;
};

GlassLab.Tile.prototype.canDropFood = function() {
  return (this.type != GlassLab.Tile.TYPES.water && !this.inPen && !this.food);
};