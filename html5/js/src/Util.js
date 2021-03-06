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

GlassLab.Util.HasCookieData = function(key)
{
    var dataArray = document.cookie.split(';');
    var keyPrefix = key + "=";
    for (var i=dataArray.length-1; i >= 0; i--)
    {
        var dataEntryString = dataArray[i];
        while(dataEntryString.charAt(0) == ' ') dataEntryString = dataEntryString.substring(1); // remove white space

        if (dataEntryString.indexOf(keyPrefix) == 0)
        {
            return true;
        }
    }

    return false;
};

// Set the text centered without allowing it to become blurred. Thanks to Owen for the fix.
GlassLab.Util.SetCenteredText = function(label, text, anchorX, anchorY) {
    if (typeof anchorX == 'undefined') anchorX = 0.5;
    if (typeof anchorY == 'undefined') anchorY = 0.5;
    if (typeof text != 'undefined' && text != null) label.text = text; // only reset text if provided

    label.anchor.x = Math.round(label.width * anchorX) / label.width; // round to avoid subpixel blur
    label.anchor.y = Math.round(label.height * anchorY) / label.height; // round to avoid subpixel blur

    return label;
};

GlassLab.Util.PixelSnapAnchor = function(obj) {
    if (typeof obj.anchor != "undefined" && typeof obj.width != "undefined" && typeof obj.height != "undefined") {
        obj.anchor.x = Math.round(obj.width * obj.anchor.x) / obj.width;
        obj.anchor.y = Math.round(obj.height * obj.anchor.y) / obj.height;
    }
    return obj;
};

GlassLab.Util.SetColoredText = function(label, text, normalColor, highlightedColor) {
    label.clearColors();
    var colorIndices = [];
    var index = 0; // this index is offset when we see a newline
    for (var k = 0; k < text.length; k++) {
        var char = text.charAt(k);
        if (char == "*") {
            colorIndices.push(index);
            text = text.substring(0, k) + text.substring(k + 1); // remove the *
            k --;
            // Also don't increment the index since we just removed a string
        } else {
            index ++;
        }
    }
    label.text = text;
    for (var j = 0; j < colorIndices.length; j++) {
        var color = (j % 2)? normalColor : highlightedColor;
        label.addColor(color, colorIndices[j]);
    }
    return label;
};

/**
 * GetFrameNamesFromPrefix - Returns an array of strings listing the data inside with all the frame names
 * @param data
 * @param prefix
 * @returns {Array}
 * @constructor
 */
GlassLab.Util.GetFrameNamesFromPrefix = function(data, prefix)
{
    var frameNames = [];

    var rawFrames = data._frames;
    for (var i=0, j=rawFrames.length; i < j; i++)
    {
        var rawFrame = rawFrames[i];
        if (rawFrame.name.indexOf(prefix) != -1)
        {
            frameNames.push(rawFrame.name);
        }
    }

    return frameNames;
};

GlassLab.Util.SetChildIndexInPlace = function(array, child, targetIndex)
{
    var currentIndex = array.indexOf(child);
    if (targetIndex < currentIndex)
    {
        while (currentIndex > targetIndex)
        {
            array[currentIndex] = array[--currentIndex];
        }

        array[targetIndex] = child;
    }
    else if (targetIndex > currentIndex)
    {
        while (currentIndex < targetIndex)
        {
            array[currentIndex] = array[++currentIndex];
        }

        array[targetIndex] = child;
    }
};

/* These are old string procressing functions that allow you to set the color using tags like in NGUI. But we're just using * to start and end highlighted sections instead.
 function getProcessedString(string)
 {
 var returnString = string;
 var replaceString = string.replace(/\[[^\]]+\]/i, "");
 while(returnString != replaceString)
 {
 returnString = replaceString;
 replaceString = replaceString.replace(/\[[^\]]+\]/i, "");
 }
 return returnString;
 }

 function getStringColorInfo(string)
 {
 // TODO: This doesn't work at all right now.
 var colors = [];
 var searchString = string;
 var colorInfo = searchString.match(/\[[^\]]+\]/i);
 var colorData = {};
 while (colorInfo)
 {
 colorData.color = colorInfo;
 searchString;
 colors.add()
 }

 return colors;
 }
    */