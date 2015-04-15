/**
 * Created by Rose Abernathy on 3/9/2015.
 */
var GlassLab = GlassLab || {};

/**
 * HUDButton - contains all the interactions specific to the HUD
 */

GlassLab.HUDButton = function(game, x, y, imageSprite, bgSprite, isIcon, callback, callbackContext)
{
    GlassLab.UIButton.prototype.constructor.call(this, game, x, y, null, callback, callbackContext);
    this.isIcon = isIcon;
    this.mousedOver = false;
    this.pressed = false;

    this.bgColor = 0x000000;
    this.bgOverColor = 0xffffff;
    this.imageColor = 0xcccccc;
    this.imageOverColor = 0x4c4c4c;

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
        this.bg.alpha = 0.5;
        this.addChild(this.bg);
    }
    else if (typeof(bgSprite) == "object") {
        // obj should be: { "bg": "key", "bg_open": "key" }
        this.bg_normal = this.game.make.sprite(0, 0, bgSprite.bg);
        this.bg_normal.anchor.setTo(0.5, 0.5);
        this.bg_normal.tint = this.bgColor;
        this.bg_normal.alpha = 0.5;
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
    this.image = this.game.make.sprite(0, 0, imageSprite);
    this.image.anchor.setTo(0.5, 0.5);
    this.addChild(this.image);
    this.image.tint = (this.isIcon? this.imageColor : 0xffffff);

    this.inputHandlers = [
        this.events.onInputDown.add(this._onDown, this), // onUp is added by UIButton
        this.events.onInputOver.add(this._onOver, this),
        this.events.onInputOut.add(this._onOut, this)
    ];
};

GlassLab.HUDButton.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.HUDButton.prototype.constructor = GlassLab.HUDButton;

GlassLab.HUDButton.prototype.setEnabled = function(enabled) {
    GlassLab.UIButton.prototype.setEnabled.apply(this, arguments);

    for (var i=this.inputHandlers.length-1; i>=0; i--)
    {
        this.inputHandlers[i].active = enabled;
    }

    if (!enabled)
    {
        this.pressed = false;

        if (this.mousedOver)
        {
            this._onOut();
        }
    }

    this._refreshColors();
};

GlassLab.HUDButton.prototype._onDown = function() {
    this.pressed = true;
    this.bg.tint = this.bgColor;
    this.bg.alpha = 1;
    this.image.tint = (this.isIcon? this.imageColor : 0xffffff);
};

GlassLab.HUDButton.prototype._onUp = function() {
    GlassLab.UIButton.prototype._onUp.apply(this, arguments);

    this.pressed = false;
    this.bg.tint = (this.mousedOver? this.bgOverColor : this.bgColor);
    this.bg.alpha = 0.5;
    this.image.tint = (this.isIcon? (this.mousedOver? this.imageOverColor : this.imageColor) : 0xffffff);
};

GlassLab.HUDButton.prototype._onOver = function() {
    if (!this.mousedOver) { // catch the case where we already over, but we got this event again after releasing the mouse
        this._tweenColors(this.bgColor, this.bgOverColor, (this.isIcon? this.imageColor : 0xffffff), (this.isIcon? this.imageOverColor : 0xffffff));
    }
    this.mousedOver = true;
};

GlassLab.HUDButton.prototype._onOut = function() {
    this.mousedOver = false;
    if (!this.pressed) {
        this._tweenColors(this.bgOverColor, this.bgColor,(this.isIcon? this.imageOverColor : 0xffffff), (this.isIcon? this.imageColor : 0xffffff));
    }
};

GlassLab.HUDButton.prototype._refreshColors = function() {
    if (!this.pressed) {
        this.bg.tint = (this.mousedOver? this.bgOverColor : this.bgColor);
        this.bg.alpha = 0.5;
        this.image.tint = (this.isIcon? (this.mousedOver? this.imageOverColor : this.imageColor) : 0xffffff);
    } else {
        this.bg.tint = this.bgColor;
        this.bg.alpha = 1;
        this.image.tint = (this.isIcon? this.imageColor : 0xffffff);
    }
};

GlassLab.HUDButton.prototype._tweenColors = function(bgStartColor, bgTargetColor, imageStartColor, imageTargetColor) {
    //console.log(this.image.key, "bg start color: ", bgStartColor, "target:", bgTargetColor);

    var colorTweenCounter = { step: 0 };
    var colorTween = this.game.add.tween(colorTweenCounter).to( { step: 1 }, 150, Phaser.Easing.Quadratic.InOut, true);

    colorTween.onUpdateCallback(function() {
        this.bg.tint = Phaser.Color.interpolateColor(bgStartColor, bgTargetColor, 1, colorTweenCounter.step);
        this.image.tint = Phaser.Color.interpolateColor(imageStartColor, imageTargetColor, 1, colorTweenCounter.step);
    }, this);
    colorTween.onComplete.addOnce(function() {
        this.bg.tint = bgTargetColor;
        this.image.tint = imageTargetColor;
    }, this);
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
    GlassLab.HUDButton.prototype.constructor.call(this, game, x, y, imageSprite, bgSprite, isIcon, callback, callbackContext);

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