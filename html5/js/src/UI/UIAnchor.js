/**
 * Created by Jerry Fu on 2/13/2015.
 */
    
var GlassLab = GlassLab || {};

/**
 * UIAnchor
 */
GlassLab.UIAnchor = function(game, dimX, dimY)
{
    Phaser.Sprite.prototype.constructor.call(this, game);

    this.dimX = dimX; // proportionately scaled X position to screen [0, 1]
    this.dimY = dimY; // proportionately scaled Y position to screen [0, 1]

    this.fixedToCamera = true;

    game.scale.onSizeChange.add(this._onScreenSizeChange, this);

    this.Refresh();
};

// Extends Sprite
GlassLab.UIAnchor.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UIAnchor.prototype.constructor = GlassLab.UIAnchor;

GlassLab.UIAnchor.prototype.Refresh = function()
{
    this.cameraOffset.x = this.game.camera.width * this.dimX;
    this.cameraOffset.y = this.game.camera.height * this.dimY;
};

GlassLab.UIAnchor.prototype._onScreenSizeChange = function()
{
    this.Refresh();
};