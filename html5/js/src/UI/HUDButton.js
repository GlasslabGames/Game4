/**
 * Created by Rose Abernathy on 3/9/2015.
 */
var GlassLab = GlassLab || {};

/**
 * HUDButton - contains all the interactions specific to the HUD.
 */

GlassLab.HUDButton = function(game, x, y, imageSprite, bgSprite, text, fontStyle, isIcon, callback, callbackContext)
{
    GlassLab.UIButton.prototype.constructor.call(this, game, x, y, null, callback, callbackContext);
    this.isIcon = isIcon;

    // overwrite these for custom color buttons
    this.bgColor = 0x000000;
    this.bgOverColor = 0xffffff;
    this.bgDownColor = 0x000000;
    this.imageColor = 0xcccccc;
    this.imageOverColor = 0x4c4c4c;
    this.imageDownColor = 0xcccccc;
    this.bgAlpha = 0.5;
    this.bgOverAlpha = 0.5;

    // BG sprite(s):
    // bgSprite is a string or an obj (containing 2 bgSprite strings, or for normal state and one for open state.)
    // this.bg will be a pointer to the currently used bgSprite.
    // leave this.bg_open = null to just just 1 sprite all the time.
    // ** currently, only HUDAminButton alters the value of this.bg upon opening and closing the inventory.
    this.bg_open = null; // alternate bg sprite for open state. (typically not used, but the foodIcon uses it)
    if (typeof(bgSprite) == "string") {
        this.bg = this.game.make.sprite(0, 0, bgSprite);
        this.bg.anchor.setTo(0.5, 0.5);
        this.bg.tint = this.bgColor;
        this.bg.alpha = this.bgAlpha;
        this.addChild(this.bg);
    }
    else if (typeof(bgSprite) == "object") {
        // obj should be: { "bg": "key", "bg_open": "key" }
        this.bg_normal = this.game.make.sprite(0, 0, bgSprite.bg);
        this.bg_normal.anchor.setTo(0.5, 0.5);
        this.bg_normal.tint = this.bgColor;
        this.bg_normal.alpha = this.bgAlpha;
        this.addChild(this.bg_normal);

        // create optional "open" state for bg, but make it invisible:
        this.bg_open = this.game.make.sprite(0, 0, bgSprite.bg_open);
        this.bg_open.anchor.setTo(0.5, 0.5);
        this.bg_open.tint = this.bgColor;
        this.bg_open.alpha = 0;
        this.addChild(this.bg_open);

        this.bg = this.bg_normal; // init bg to normal state
    }

    // image sprite:
    if (imageSprite) {
        this.image = this.game.make.sprite(0, 0, imageSprite);
        this.image.anchor.setTo(0.5, 0.5);
        this.addChild(this.image);
        if (this.isIcon) this.image.tint = this.imageColor;
    }

    if (text) {
        this.label = this.game.make.text(0, 0, text, fontStyle);
        this.label.anchor.setTo(0.5, 0.5);
        this.addChild(this.label);
        if (this.isIcon) {
            this.fontStyle = fontStyle;
            this.fontStyle.fill = "#"+this.imageColor.toString(16);
            this.label.setStyle(this.fontStyle);
        }
    }

    // Note that UIButton adds all input handlers
};

GlassLab.HUDButton.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.HUDButton.prototype.constructor = GlassLab.HUDButton;

GlassLab.HUDButton.prototype._onOver = function() {
    if (!this.over) { // no need to tween get this event unnecessarily after releasing the mouse
        this.game.add.tween(this.bg).to( { alpha: this.bgOverAlpha }, 150, Phaser.Easing.Quadratic.InOut, true);
        var tween = this._tweenColors(this.bgColor, this.bgOverColor, (this.isIcon? this.imageColor : 0xffffff), (this.isIcon? this.imageOverColor : 0xffffff));
        tween.onComplete.addOnce(this.whenOver, this);
    }
    this.over = true;
    // Note we don't want to call UIButton._onOver - it sets the colors directly, which we don't want
};

GlassLab.HUDButton.prototype._onOut = function() {
    this.over = false;
    if (!this.pressed) {
        this.game.add.tween(this.bg).to( { alpha: this.bgAlpha }, 150, Phaser.Easing.Quadratic.InOut, true);
        var tween = this._tweenColors(this.bgOverColor, this.bgColor,(this.isIcon? this.imageOverColor : 0xffffff), (this.isIcon? this.imageColor : 0xffffff));
        tween.onComplete.addOnce(this.whenUp, this);
    }
};

GlassLab.HUDButton.prototype.whenUp = function() {
    this.bg.alpha =  this.bgAlpha;
    this.bg.tint = this.bgColor;
    if (this.image && this.isIcon) this.image.tint = this.imageColor;
    if (this.label && this.isIcon) this._setLabelColor(this.imageColor);
};

GlassLab.HUDButton.prototype.whenDown = function() {
    this.bg.tint = this.bgDownColor;
    this.bg.alpha = 1;
    if (this.image && this.isIcon) this.image.tint = this.imageDownColor;
    if (this.label && this.isIcon) this._setLabelColor(this.imageDownColor);
};

GlassLab.HUDButton.prototype.whenOver = function() {
    this.bg.alpha = this.bgOverAlpha;
    this.bg.tint = this.bgOverColor;
    if (this.image && this.isIcon) this.image.tint = this.imageOverColor;
    if (this.label && this.isIcon) this._setLabelColor(this.imageOverColor);
};

GlassLab.HUDButton.prototype._tweenColors = function(bgStartColor, bgTargetColor, imageStartColor, imageTargetColor) {
    var colorTweenCounter = { step: 0 };
    var colorTween = this.game.add.tween(colorTweenCounter).to( { step: 1 }, 150, Phaser.Easing.Quadratic.InOut, true);

    colorTween.onUpdateCallback(function() {
        this.bg.tint = Phaser.Color.interpolateColor(bgStartColor, bgTargetColor, 1, colorTweenCounter.step);
        var currentColor = Phaser.Color.interpolateColor(imageStartColor, imageTargetColor, 1, colorTweenCounter.step);
        if (this.image) this.image.tint = currentColor;
        if (this.label) this._setLabelColor(currentColor);
    }, this);
    return colorTween;
};

GlassLab.HUDButton.prototype._setLabelColor = function(color) {
    var colorObj = Phaser.Color.valueToColor(color);
    var colorString = "#"+Phaser.Color.componentToHex(colorObj.r)+Phaser.Color.componentToHex(colorObj.g)+Phaser.Color.componentToHex(colorObj.b);
    this.fontStyle.fill = colorString;
    this.label.setStyle(this.fontStyle);
};

GlassLab.HUDButton.prototype.getWidth = function() {
    return this.bg.width;
};

GlassLab.HUDButton.prototype.getHeight = function() {
    return this.bg.height;
};

/**
 * HUDAnimButton - for the journal, food, etc buttons
 */
GlassLab.HUDAnimButton = function(game, x, y, imageSprite, bgSprite, isIcon, callback, callbackContext)
{
    GlassLab.HUDButton.prototype.constructor.call(this, game, x, y, imageSprite, bgSprite, null, null, isIcon, callback, callbackContext);

    // imageSprites for closed, full, open, open-full, and animated states:
    this.defaultSpriteName = imageSprite;
    this.openSpriteName = imageSprite + "_open";
    this.openFullSpriteName = this.openSpriteName + "_full";
    if (!this.game.cache.checkImageKey(this.openFullSpriteName)) this.openFullSpriteName = this.openSpriteName; // fallback if we don't have a different sprite
    this.animatedSpriteName = imageSprite + "_anim";
    this.fullSpriteName = imageSprite + "_full";
    if (!this.game.cache.checkImageKey(this.fullSpriteName)) this.fullSpriteName = this.defaultSpriteName; // fallback if we don't have a different sprite

    this.active = false; // this is true when they have mail in the mailbox, etc
    this.open = false; // this is true when the mail, journal, etc is currently open on the screen
};

GlassLab.HUDAnimButton.prototype = Object.create(GlassLab.HUDButton.prototype);
GlassLab.HUDAnimButton.prototype.constructor = GlassLab.HUDAnimButton;

GlassLab.HUDAnimButton.prototype.toggleOpen = function(open) {
    if (typeof open == 'undefined') open = !this.open;
    this.open = open;
    this._refreshImage();
};

GlassLab.HUDAnimButton.prototype.toggleActive = function(active) {
    if (typeof active == 'undefined') active = !this.active;
    this.active = active;
    if (this.active) this.full = true; // it must be full to be active
    this._refreshImage();
};

GlassLab.HUDAnimButton.prototype.toggleFull = function(full) {
    if (typeof full == 'undefined') full = !this.full;
    this.full = full;
    if (!this.full) this.active = false; // it can't be active if it's not full
    this._refreshImage();
};

GlassLab.HUDAnimButton.prototype._refreshImage = function() {
    var spriteName;
    if (this.open) {
        if (this.full) spriteName = this.openFullSpriteName;
        else spriteName = this.openSpriteName;

        // bg swap?
        if (this.bg_open != null) {
            this.bg = this.bg_open;
            this.bg_normal.alpha = 0; // hide the inactive bgsprite
        }

        this.isIcon = true;
    } else {
        if (this.active) spriteName = this.animatedSpriteName;
        else if (this.full) spriteName = this.fullSpriteName;
        else spriteName = this.defaultSpriteName;

        // bg swap?
        if (this.bg_open != null) {
            this.bg = this.bg_normal; // bg_normal is defined when bg_open is defined.
            this.bg_open.alpha = 0; // hide the inactive bgsprite
        }

        this.isIcon = false;
    }

    this._refreshColors();

    //console.log("Prev image:",this.image.key,"New image:",spriteName);
    if (this.image.key != spriteName) {
        this.image.loadTexture(spriteName);
        if (spriteName == this.animatedSpriteName) { // start animation
            this.image.animations.add('anim');
            this.image.animations.play('anim', 48, true);
        }
    }
};

GlassLab.HUDButton.prototype._refreshColors = function() {
    if (this.pressed) this.whenDown();
    else if (this.over) this.whenOver();
    else this.whenUp();
};