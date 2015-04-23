/**
 * Created by Jerry Fu on 1/28/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UIButton
 */

GlassLab.UIButton = function(game, x, y, spriteName, callback, callbackContext)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y, spriteName);

    this.inputEnabled = true;
    this.input.priorityID = GLOBAL.UIpriorityID;

    this.callback = callback;
    this.callbackContext = callbackContext;
    this.inputHandlers = [
        this.events.onInputDown.add(this._onDown, this),
        this.events.onInputUp.add(this._onUp, this),
        this.events.onInputOver.add(this._onOver, this),
        this.events.onInputOut.add(this._onOut, this)
        ];

    this.over = false;
    this.pressed = false;
};

GlassLab.UIButton.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIButton.prototype.constructor = GlassLab.UIButton;

GlassLab.UIButton.prototype.setEnabled = function(enabled) {
    for (var i = 0; i < this.inputHandlers.length; i++) {
        this.inputHandlers[i].active = enabled;
    }

    if (!enabled)
    {
        this.pressed = false;
        if (this.over) this._onOut();
    }

    this.enabled = enabled;
    this.refresh();
};

GlassLab.UIButton.prototype._onUp = function() {
    GLOBAL.audioManager.playSound("clickSound");
    if (this.callback) this.callback.apply(this.callbackContext, arguments);

    this.pressed = false;
    if (this.over) this.whenOver();
    else this.whenUp();
};

GlassLab.UIButton.prototype._onDown = function() {
    this.pressed = true;
    this.whenDown();
};

GlassLab.UIButton.prototype._onOver = function() {
    this.over = true;
    if (!this.pressed) this.whenOver();
};

GlassLab.UIButton.prototype._onOut = function() {
    this.over = false;
    if (!this.pressed) this.whenUp();
};

GlassLab.UIButton.prototype.refresh = function() {
    if (!this.enabled) this.whenDisabled();
    else if (this.pressed) this.whenDown();
    else if (this.over) this.whenOver();
    else this.whenUp();
};

// Override these to set the different highlight states of the button
GlassLab.UIButton.prototype.whenUp = function() {};
GlassLab.UIButton.prototype.whenDown = function() {};
GlassLab.UIButton.prototype.whenOver = function() {};
GlassLab.UIButton.prototype.whenDisabled = function() {};

/**
 * UITextButton - like UIButton but with text
 */

GlassLab.UITextButton = function(game, x, y, spriteName, text, fontStyle, callback, callbackContext) {
    GlassLab.UIButton.prototype.constructor.call(this, game, x, y, spriteName);
    this.label = game.make.text(0, 0, text, fontStyle);
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);
};

GlassLab.UITextButton.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.UITextButton.prototype.constructor = GlassLab.UITextButton;

/**
 * UIRectButton - a button that uses graphics to draw a square
 */

GlassLab.UIRectButton = function(game, x, y, callback, callbackContext, width, height, color, text, fontsize) {
    this.actualWidth = width; this.actualHeight = height; // remember these since we can't set this.width directly without affecting the scale
    this.color = color;

    GlassLab.UIButton.prototype.constructor.call(this, game, x, y, null, callback, callbackContext);

    this.graphic = game.make.graphics();
    this.graphic.beginFill(color).lineStyle(3, 0x000000).drawRect(0,0,width,height);
    this.addChild(this.graphic);

    var style = { font: "bold " + (fontsize || 20) + "px Arial", fill: "#000000", align: "center" };
    this.label = game.make.text(width/2, height/2, text, style);
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);
};

GlassLab.UIRectButton.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.UIRectButton.prototype.constructor = GlassLab.UIRectButton;

GlassLab.UIRectButton.prototype.setEnabled = function(enabled) {
    GlassLab.UIButton.prototype.setEnabled.call(this, enabled);
    this.label.setStyle({ fill:(enabled? "#000000" : "#bbbbbb") });
    this.graphic.beginFill(this.color).lineStyle(3, (enabled? 0x000000 : 0xbbbbbb)).drawRect(0,0,this.actualWidth,this.actualHeight);
};