/**
 * Created by Jerry Fu on 3/13/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Util = {};

// STATIC POINTS TO REUSE FOR CALCULATIONS
GlassLab.Util.POINT2 = new Phaser.Point();
GlassLab.Util.ISOPOINT = new Phaser.Plugin.Isometric.Point3();

GlassLab.Util.GetGlobalIsoPosition = function(sprite, out, isoX, isoY)
{
    var pos = out ? out : new Phaser.Point();
    pos.setTo(typeof isoX != "undefined" ? isoX : sprite.isoX,
        typeof isoY != "undefined" ? isoY : sprite.isoY);

    while (sprite.parent && sprite.parent.isoPosition) {
        sprite = sprite.parent;
        pos.x += sprite.isoX;
        pos.y += sprite.isoY;
    }
    return pos;
};

/**
 * Converts a global position into a position local to the passed in target
 * @param {Phaser.Isometric.IsoSprite} sprite - The reference sprite for calculating local position
 * @param {float} isoX - Global isometric X position
 * @param {float} isoY - Global isometric Y position
 * @param {Phaser.Point} out - Point we want to return, new point made if null
 * @returns {Phaser.Point}
 * @constructor
 */
GlassLab.Util.GetLocalIsoPosition = function(sprite, out, isoX, isoY)
{
    var pos = out ? out.setTo(isoX, isoY) : new Phaser.Point(isoX, isoY);
    while (sprite.parent && sprite.parent.isoPosition) {
        sprite = sprite.parent;
        pos.x -= sprite.isoX;
        pos.y -= sprite.isoY;
    }
    return pos;
};