/**
 * Created by Jerry Fu on 2/13/2015.
 */
    
var GlassLab = GlassLab || {};

/**
 * ScrollingTileSprite - a built-in tileSprite that scrolls with the camera movement
 */
GlassLab.ScrollingTileSprite = function(game, key, frame)
{
    Phaser.TileSprite.prototype.constructor.call(this, game, 0, 0, 100, 100, key, frame);

    this.width = 1000;
    this.height = 1000;
    this.scale.setTo(2, 2);
    //GlassLab.SignalManager.update.add(this._update, this);
};

// Extends Sprite
GlassLab.ScrollingTileSprite.prototype = Object.create(Phaser.TileSprite.prototype);
GlassLab.ScrollingTileSprite.prototype.constructor = GlassLab.ScrollingTileSprite;

/*
GlassLab.ScrollingTileSprite.prototype._update = function()
{
    //this.scale.setTo(1 / GLOBAL.WorldLayer.scale.x, 1 / GLOBAL.WorldLayer.scale.y);
    this.tilePosition.x = -this.game.camera.x * GLOBAL.WorldLayer.scale.x;
    this.tilePosition.y = -this.game.camera.y * GLOBAL.WorldLayer.scale.y;
};*/