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

GlassLab.TileManager.prototype.GetTileData = function(x, y, layer)
{
    layer = layer || "ground";
    var tileData = this.tilemap.getTile(x, y, layer);
    return tileData ? tileData.index-1  : -1;
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

GlassLab.TileManager.prototype.GenerateMapData = function(mapAssetName)
{
    var tilemapData = this.game.cache.getTilemapData(mapAssetName);
    var tilemapRaw = tilemapData.data;
    var tilemap = new Phaser.Tilemap(this.game);
    tilemap.removeAllLayers(); // tilemaps are instantiated with an empty layer

    for (var layerIndex = 0, totalLayers = tilemapRaw.layers.length; layerIndex < totalLayers; layerIndex++)
    {
        var rawLayer = tilemapRaw.layers[layerIndex];
        tilemap.createBlankLayer(rawLayer.name, tilemapRaw.width, tilemapRaw.height, 1,1);

        for (var j = 0; j < tilemapRaw.height; j++)
        {
            for (var i=0; i < tilemapRaw.width; i++)
            {
                tilemap.putTile(rawLayer.data[i + j*tilemapRaw.width], i, j);
            }
        }
    }

    tilemap.setLayer("ground");
    tilemap.width = tilemapRaw.width;
    tilemap.height = tilemapRaw.height;

    tilemap.tilesets = tilemapRaw.tilesets;

    GLOBAL.astar.setAStarMap(tilemap, "ground", "map_art_v2");

    return tilemap;
};

GlassLab.TileData = function() {
    this.id = -1;
    this.properties = {};
    this.imageKey = "";
    this.image = "";
};

GlassLab.TileManager.prototype.GenerateMapFromDataToGroup = function(tilemap)
{
    this.tilemap = tilemap;
    console.log(this.tilemap);
    console.log(this.game.cache.getTilemapData("worldTileMap"));

    this.SetCenter(this.tilemap.width/2, this.tilemap.height/2);

    var parent = this.game.make.sprite();
    var creatureLayerGroup = this.game.make.group();
    var groundLayerGroup = this.game.make.group();

    for (var i = 0, max_i = this.tilemap.width; i < max_i; i++) //var i=this.tilemap.width-1; i>=0; i--)
    {
        for (var j = 0, max_j = this.tilemap.height; j < max_j; j++) //var j=this.tilemap.height-1; j>=0; j--)
        {
            var tilesetProperties = this.tilemap.tilesets[0].tileproperties;
            for (var layerIndex = 0; layerIndex < this.tilemap.layers.length; layerIndex++)
            {

                var layer = this.tilemap.layers[layerIndex];
                var shouldSortWithCreatures = layer.name == "border";
                var tileType = this.GetTileData(i, j, layer.name);
                if (tileType == -1) continue;

                var image = new GlassLab.Tile(this.game, i, j, tileType);

                if (shouldSortWithCreatures) creatureLayerGroup.add(image);
                else groundLayerGroup.add(image);

                /*                if (shouldSortWithCreatures)
                 {
                 image._preOptimizedParent = GLOBAL.creatureLayer;
                 }
                 else
                 {
                 image._preOptimizedParent = GLOBAL.groundLayer;
                 }

                 GLOBAL.renderManager.AddToIsoWorld(image);*/

                if (!this.map[i]) this.map[i] = [];

                var tileProperties = tilesetProperties[tileType];
                if (!tileProperties.hasOwnProperty("interactable") || tileProperties.interactable !== "false")
                {
                    this.map[i][j] = image;
                }

                /*if (GLOBAL.debug)
                 {
                 var text = this.game.make.text(0,0, "(" + i + ", " + j + ")");
                 text.anchor.set(0.5, 0.5);
                 image.addChild(text);
                 if (image.scale.x < 0)
                 {
                 text.scale.x = -text.scale.x;
                 }
                 }*/
            }
        }
    }

    var xOffset = -100, yOffset = 300;

    this.game.iso.simpleSort(groundLayerGroup);
    for (var i = 0; i < groundLayerGroup.children.length; i++) {
        var sprite = groundLayerGroup.getChildAt(i);
        var pos = this.game.iso.project(sprite.isoPosition);
        var info = sprite.imageOffset;
        GLOBAL.bgData.draw(sprite, pos.x + GLOBAL.bgData.width / 2 + info.w / 2 + xOffset, pos.y + GLOBAL.bgData.height / 2 + info.h + yOffset);
    }

    this.game.iso.simpleSort(creatureLayerGroup);
    for (var i = 0; i < creatureLayerGroup.children.length; i++) {
        var sprite = creatureLayerGroup.getChildAt(i);
        var pos = this.game.iso.project(sprite.isoPosition);
        var info = sprite.imageOffset;
        GLOBAL.bgData.draw(sprite, pos.x + GLOBAL.bgData.width / 2 + info.w / 2 + xOffset, pos.y + GLOBAL.bgData.height / 2 + info.h + yOffset);
    }

    if (GLOBAL.groundLayer.cacheAsBitmap)
    {
        GLOBAL.groundLayer.GLASSLAB_BITMAP_DIRTY = true;
    }

    //this.game.iso.simpleSort(GLOBAL.creatureLayer);
    //this.game.iso.simpleSort(GLOBAL.groundLayer);
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
    var worldX = (indexX - this.centerTile.x) * this.tileSize - this.tileSize/2.0;
    var worldY = (indexY - this.centerTile.y) * this.tileSize - this.tileSize/2.0;

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
    var tileX = parseInt(Math.round(x / this.tileSize + this.centerTile.x + .5));
    var tileY = parseInt(Math.round(y / this.tileSize + this.centerTile.y + .5));

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
    var isoPosition = this.game.iso.unproject(GlassLab.Util.POINT2.setTo(x,y));
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
    var isoPosition = this.game.iso.unproject(GlassLab.Util.POINT2.setTo(x,y));
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
            tile.food = null;
        }
    }
  }
};

GlassLab.TileManager.prototype.getObjectsInTile = function(col, row) {
    return this.getTile(col, row).getObjectsInTile();
};

GlassLab.TileManager.prototype.getRandomWalkableTile = function(limit) {
    limit = limit || 0;
    var maxWidth = limit || this.GetMapWidth();
    var maxHeight = limit || this.GetMapHeight();
  var n = 0;
    var targetTile;
  while ((!targetTile || !targetTile.getIsWalkable()) && n++ < 3000) // safeguard against infinite loops
  {
      var randCol = parseInt(Math.random() * maxWidth) - parseInt(limit / 2);
      var randRow = parseInt(Math.random() * maxHeight) - parseInt(limit / 2);
      if (limit) {
        randCol += this.GetMapWidth() / 2;
        randRow += this.GetMapHeight() / 2;
      }
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
      if (tile && tile.isTarget(creature) && tile.getIsWalkable(creature.type)) tiles.push(tile);
    }
  }
  return tiles;
};