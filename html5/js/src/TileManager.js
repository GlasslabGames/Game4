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
    return this.map[x][y];
};

GlassLab.TileManager.prototype.GetMapLength = function()
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

GlassLab.TileManager.prototype.ReplaceTileAt = function(x, y, newTileType)
{
  var tile = this.GetTile(x, y);
  tile.Swap(newTileType);
};

GlassLab.TileManager.prototype.GenerateRandomMapData = function(width, height, min, max)
{
    for (var i=0; i < width; i++)
    {
        for (var j=0; j < height; j++)
        {
            if (!this.mapData[i]) this.mapData[i] = [];
            var centerDist = Math.sqrt( (j - height / 2.0)*(j - height / 2.0) + (i - width / 2.0) * (i - width / 2.0));
            if (centerDist > 7.5) this.mapData[i][j] = GlassLab.Tile.TYPES.water; // water
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

    if (out)
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

GlassLab.TileManager.prototype.GetTileAtWorldPosition = function(x, y)
{
    var tilePosition = this.GetTileIndexAtWorldPosition(x,y);
    return this.GetTile(tilePosition.x, tilePosition.y);
};

GlassLab.TileManager.prototype.TryGetTileAtWorldPosition = function(x, y)
{
    var tilePosition = this.GetTileIndexAtWorldPosition(x,y);
    if (tilePosition.x < 0 || tilePosition.x >= this.map.length || tilePosition.y < 0 || tilePosition.y >= this.map[0].length) return null;

    return this.GetTile(tilePosition.x, tilePosition.y);
};

/**
 * Tile
 */
GlassLab.Tile = function(game, col, row, type) {
  Phaser.Plugin.Isometric.IsoSprite.prototype.constructor.call(this, game, (col-10)*GLOBAL.tileSize, (row-10)*GLOBAL.tileSize, 0, type);
  this.type = type;
  this.anchor.setTo(0.5, 0.5);
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