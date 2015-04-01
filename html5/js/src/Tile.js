/**
 * Created by Jerry on 3/11/2015.
 */

/**
 * Tile
 */
GlassLab.Tile = function(game, col, row, type) {
    var imageName = this._getImageFromType(type);
    Phaser.Plugin.Isometric.IsoSprite.prototype.constructor.call(this, game, (col-GLOBAL.tileManager.tilemap.width/2)*GLOBAL.tileSize, (row-GLOBAL.tileManager.tilemap.height/2)*GLOBAL.tileSize, 0, "tiles", imageName);
    this.type = type;
    //this.tint = Phaser.Color.getColor(Math.random() * 255, Math.random() * 255, Math.random() * 255); // for testing with clearly distinguished tiles (change type to placeholderTile)
    this.anchor.setTo(0.5, 0.5);
    this.col = col;
    this.row = row;
    this.inPen = null;
    this.food = null;
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

GlassLab.Tile.prototype.GetTileData = function()
{
    return GLOBAL.tileManager.tilemap.getTile(this.col, this.row);
};

GlassLab.Tile.prototype.swapType = function(newType) {
    if (this.type == newType) return;
    this.prevType = this.type;
    this.type = newType;
    this.loadTexture( "tiles", this._getImageFromType(this.type) );
};

GlassLab.Tile.prototype.unswapType = function() {
    if (!this.prevType) return;
    this.type = this.prevType;
    this.prevType = null;
    this.loadTexture( "tiles", this._getImageFromType(this.type) );
};

GlassLab.Tile.prototype.isTarget = function(creature) {
    if (this.targetCreatureType == creature.type && !this.inPen.feeding) return true; // yes, this is a target pen slot
    else if (this.food && creature.desiredAmountsOfFood && (this.food.type in creature.desiredAmountsOfFood)) return true; // yes, there's food we want here
    else return false; // boring
};

GlassLab.Tile.prototype.setInPen = function(pen, targetCreatureType) {
    GlassLab.SignalManager.tilePenStateChanged.dispatch(this, pen);

    this.inPen = pen;
    // check if tile is within food area
    var inFeedingArea = this.inPen && !this.inPen._containsTile(this, true);


    // Check neighboring tiles for collision
    var tile, neighborInFeedingArea;
    if (tile = GLOBAL.tileManager.GetTile(this.col+1, this.row))
    {
        neighborInFeedingArea = tile.inPen && !tile.inPen._containsTile(tile, true);
        this.GetTileData().collideRight = tile.GetTileData().collideLeft = inFeedingArea != neighborInFeedingArea;
    }
    if (tile = GLOBAL.tileManager.GetTile(this.col-1, this.row))
    {
        neighborInFeedingArea = tile.inPen && !tile.inPen._containsTile(tile, true);
        this.GetTileData().collideLeft = tile.GetTileData().collideRight = inFeedingArea != neighborInFeedingArea;
    }
    if (tile = GLOBAL.tileManager.GetTile(this.col, this.row-1))
    {
        neighborInFeedingArea = tile.inPen && !tile.inPen._containsTile(tile, true);
        this.GetTileData().collideUp = tile.GetTileData().collideDown = inFeedingArea != neighborInFeedingArea;
    }
    if (tile = GLOBAL.tileManager.GetTile(this.col, this.row+1))
    {
        neighborInFeedingArea = tile.inPen && !tile.inPen._containsTile(tile, true);
        this.GetTileData().collideDown = tile.GetTileData().collideUp = inFeedingArea != neighborInFeedingArea;
    }

    if (pen)
    {
        this.targetCreatureType = targetCreatureType;
    }
    else
    {
        this.targetCreatureType = null;
    }
};

/*
GlassLab.Tile.prototype.onCreatureEnter = function(creature) {
    creature.tile = this;

    if (GLOBAL.debug) this.tint = 0xff0000;
};

GlassLab.Tile.prototype.onCreatureExit = function(creature) {
    if (creature.tile == this) creature.tile = null;

    if (GLOBAL.debug) this.tint = 0xffffff;
};
*/

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

GlassLab.Tile.prototype.getIsWalkable = function() {
    var tileProperties = GLOBAL.tileManager.tilemap.tilesets[0].tileproperties[this.type];
    return (tileProperties.hasOwnProperty("walkable") && tileProperties.walkable === "true") // Walkable
        && (!this.inPen || this.inPen._containsTile(this, true));
};

GlassLab.Tile.prototype.getObjectsInTile = function() {
    var objects = [];
    var allCreatures = GLOBAL.creatureManager.creatures;

    for (var i=allCreatures.length-1; i>=0; i--)
    {
        var creature = allCreatures[i];
        if (creature.getTile() == this)
        {
            objects.push(creature);
        }
    }

    return objects;
};

GlassLab.Tile.prototype.canDropFood = function() {
    return (this.getIsWalkable() && !this.inPen && !this.food);
};