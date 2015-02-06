/**
 * Created by Jerry Fu on 1/28/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UIButton
 */

GlassLab.UIButton = function(game, x, y, callback, callbackContext, width, height, color, text)
{
    this.actualWidth = width; this.actualHeight = height; // remember these since we can't set this.width directly without affecting the scale

    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);//, null, callback, callbackContext);

    this.graphic = game.make.graphics();
    this.graphic.beginFill(color).lineStyle(3, 0x000000).drawRect(0,0,width,height);
    this.addChild(this.graphic);

    this.label = game.make.text(width/2, height/2, text);
    this.label.anchor.setTo(.5, .5);
    this.addChild(this.label);

    this.inputEnabled = true;
    this.input.priorityID = GLOBAL.UIpriorityID;
    this.events.onInputDown.add(callback, callbackContext);
};

GlassLab.UIButton.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIButton.prototype.constructor = GlassLab.UIButton;

GlassLab.UIButton.prototype.getWidth = function() {
  return this.actualWidth;
};

GlassLab.UIButton.prototype.getHeight = function() {
  return this.actualHeight;
};