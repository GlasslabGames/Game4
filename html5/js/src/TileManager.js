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
    if (x < 0 || x >= this.tileMap.width || y < 0 || y >= this.tileMap.height) return null;

    return this.GetTileData(x, y);
};

GlassLab.TileManager.prototype.GetTileData = function(x, y)
{
    var tileData = this.tilemap.getTile(x, y, "default");
    return tileData ? this.tilemap.getTile(x, y, "default").index-1  : -1;
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

GlassLab.TileManager.prototype.GenerateRandomMapData = function(width, height)
{
    var tilemapData = this.game.cache.getTilemapData("testTileMap");
    var tilemap = new Phaser.Tilemap(this.game);
    tilemap.create("default", tilemapData.data.width, tilemapData.data.height, 1,1);

    for (var j = 0; j < tilemapData.data.height; j++)
    {
        for (var i=0; i < tilemapData.data.width; i++)
        {
            tilemap.putTile(tilemapData.data.layers[0].data[i + j*tilemapData.data.width], i, j);
        }
    }
    tilemap.tilesets = tilemapData.data.tilesets;

    GLOBAL.astar.setAStarMap(tilemap, "default", "Tiles");

    return tilemap;
};

GlassLab.TileData = function() {
    this.id = -1;
    this.properties = {};
    this.imageKey = "";
    this.image = "";
};

GlassLab.TileManager.prototype.GenerateMapFromDataToGroup = function(tilemap, parentGroup)
{
    this.tilemap = tilemap;

    this.SetCenter(this.tilemap.width/2, this.tilemap.height/2);
    function isFence(num) { return num >= 5 && num <= 8; }
    for (var i=this.tilemap.width-1; i>=0; i--)
    {
        for (var j=this.tilemap.height-1; j>=0; j--)
        {
            var tileType = this.GetTileData(i, j);
            if (tileType == -1) continue;

            var image = new GlassLab.Tile(this.game, i, j, tileType);
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
        if (tile)
        {
            tile.setInPen(false);
            tile.unswapType();
            tile.occupant = null;
            tile.food = null;
        }
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
  while ((!targetTile || !targetTile.getIsWalkable()) && n++ < 3000) // safeguard against infinite loops
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
      if (tile && tile.isTarget(creature)) tiles.push(tile);
    }
  }
  return tiles;
};


/**
 * Tile
 */
GlassLab.Tile = function(game, col, row, type) {
    var imageName = this._getImageFromType(type);
  Phaser.Plugin.Isometric.IsoSprite.prototype.constructor.call(this, game, (col-GLOBAL.tileManager.tilemap.width/2)*GLOBAL.tileSize, (row-GLOBAL.tileManager.tilemap.height/2)*GLOBAL.tileSize, 0, imageName);
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

GlassLab.Tile.prototype._getImageFromType = function(type)
{
    var imageName = GLOBAL.tileManager.tilemap.tilesets[0].tiles[type].image;
    // remove full address and get just file name
    var fileNameIndex = imageName.lastIndexOf("/");
    if (fileNameIndex != -1)
    {
        imageName = imageName.substring(fileNameIndex+1);
    }

    return imageName;
};

GlassLab.Tile.TYPES = {
  water : 8,
  grass : 14,
  mushroom0 : 13,
  mushroom1 : 11,
  mushroom2 : 12,
  dirt : 9
};

GlassLab.Tile.prototype.swapType = function(newType) {
  if (this.type == newType) return;
  this.prevType = this.type;
  this.type = newType;
  this.loadTexture( this._getImageFromType(this.type) );
};

GlassLab.Tile.prototype.unswapType = function() {
  if (!this.prevType) return;
  this.type = this.prevType;
  this.prevType = null;
    this.loadTexture( this._getImageFromType(this.type) );
};

GlassLab.Tile.prototype.isTarget = function(creature) {
  if (this.occupant && this.occupant != creature ) return false; // nope, someone's here already
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
    creature.tile = this;

    if (GLOBAL.debug) this.tint = 0xff0000;
  //if (this.isTarget(creature.type)) creature.enterPen(this.inPen);
};

GlassLab.Tile.prototype.onCreatureExit = function(creature) {
  if (this.occupant == creature) this.occupant = null;
    if (creature.tile == this) creature.tile = null;

    if (GLOBAL.debug) this.tint = 0xffffff;
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
    var tileProperties = GLOBAL.tileManager.tilemap.tilesets[0].tileproperties[this.type];
    return ((tileProperties.hasOwnProperty("walkable") && tileProperties.walkable === "true") // Walkable
        //|| (this.type != GlassLab.Tile.TYPES.water) // blocked by water (OBSOLETE ID)
        && !this.occupant // Blocked by occupant
        && !this.inPen)
        || (creatureType && this.targetCreatureType == creatureType); // allow walking in pen if the creature type matches;
};

GlassLab.Tile.prototype.canDropFood = function() {
  return (this.type != GlassLab.Tile.TYPES.water && !this.inPen && !this.food);
};