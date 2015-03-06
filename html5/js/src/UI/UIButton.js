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
    this.inputHandler = this.events.onInputDown.add(this._onDown, this);
};

GlassLab.UIButton.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIButton.prototype.constructor = GlassLab.UIButton;

GlassLab.UIButton.prototype.setEnabled = function(enabled) {
    this.alpha = (enabled)? 1 : 0.5;
    this.inputHandler.active = enabled;
};

GlassLab.UIButton.prototype._onDown = function() {
    GLOBAL.audioManager.playSound("click");
    this.callback.apply(this.callbackContext, arguments);
};

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

    var style = { font: "bold "+ (fontsize || 20) + "px Arial", fill: "#000000", align: "center" };
    this.label = game.make.text(width/2, height/2, text, style);
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);
};

GlassLab.UIRectButton.prototype = Object.create(GlassLab.UIButton.prototype);
GlassLab.UIRectButton.prototype.constructor = GlassLab.UIRectButton;

GlassLab.UIRectButton.prototype.setEnabled = function(enabled) {
    this.label.setStyle({ fill:(enabled? "#000000" : "#bbbbbb") });
    this.graphic.beginFill(this.color).lineStyle(3, (enabled? 0x000000 : 0xbbbbbb)).drawRect(0,0,this.actualWidth,this.actualHeight);
    this.inputHandler.active = enabled;
};