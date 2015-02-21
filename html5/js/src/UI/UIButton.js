/**
 * Created by Jerry Fu on 1/28/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UIButton
 */

GlassLab.UIButton = function(game, x, y, callback, callbackContext, width, height, color, text, fontsize)
{
    this.actualWidth = width; this.actualHeight = height; // remember these since we can't set this.width directly without affecting the scale
    this.color = color;

    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);//, null, callback, callbackContext);

    this.graphic = game.make.graphics();
    this.graphic.beginFill(color).lineStyle(3, 0x000000).drawRect(0,0,width,height);
    this.addChild(this.graphic);

    var style = { font: "bold "+ (fontsize || 20) + "px Arial", fill: "#000000", align: "center" };
    this.label = game.make.text(width/2, height/2, text, style);
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);

    this.inputEnabled = true;
    this.input.priorityID = GLOBAL.UIpriorityID;
    this.callbackHandler = this.events.onInputDown.add(callback, callbackContext);
};

GlassLab.UIButton.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIButton.prototype.constructor = GlassLab.UIButton;

GlassLab.UIButton.prototype.getWidth = function() {
  return this.actualWidth;
};

GlassLab.UIButton.prototype.getHeight = function() {
  return this.actualHeight;
};

GlassLab.UIButton.prototype.setEnabled = function(enabled) {
    this.label.setStyle({ fill:(enabled? "#000000" : "#bbbbbb") });
    this.graphic.beginFill(this.color).lineStyle(3, (enabled? 0x000000 : 0xbbbbbb)).drawRect(0,0,this.actualWidth,this.actualHeight);
    this.callbackHandler.active = enabled;
};