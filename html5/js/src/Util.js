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

    while (sprite.parent) {
        sprite = sprite.parent;
        if (sprite.isoPosition) {
            pos.x += sprite.isoX;
            pos.y += sprite.isoY;
        }
    }
    return pos;
};

GlassLab.Util.GetGlobalPosition = function(sprite, out, x, y)
{
    var pos = out ? out : new Phaser.Point();
    pos.setTo(typeof x != "undefined" ? x : sprite.x,
        typeof y != "undefined" ? y : sprite.y);

    while (sprite.parent) {
        sprite = sprite.parent;
        if (sprite.position) {
            pos.x += sprite.x;
            pos.y += sprite.y;
        }
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
    while (sprite.parent) {
        sprite = sprite.parent;
        if (sprite.isoPosition) {
            pos.x -= sprite.isoX;
            pos.y -= sprite.isoY;
        }
    }
    return pos;
};

GlassLab.Util.SetCookieData = function(key, data)
{
    var parsedInput = key + "=" + data;

    // NOTE: This native call does not actually overwrite the entire cookie, but creates an entry using the key name
    document.cookie = parsedInput;
};

GlassLab.Util.GetCookieData = function(key)
{
    var dataArray = document.cookie.split(';');
    var keyPrefix = key + "=";
    for (var i=dataArray.length-1; i >= 0; i--)
    {
        var dataEntryString = dataArray[i];
        while(dataEntryString.charAt(0) == ' ') dataEntryString = dataEntryString.substring(1); // remove white space

        if (dataEntryString.indexOf(keyPrefix) == 0)
        {
            return dataEntryString.substring(keyPrefix.length);
        }
    }
};