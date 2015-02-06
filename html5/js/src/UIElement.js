/**
 * Created by Jerry Fu on 2/5/2015.
 */


var GlassLab = GlassLab || {};

/**
 * UIElement
 *
 * Superclass of all UI elements.
 *
 * Used so you can expect a UIRefresh signal on the class that
 * will signal parent or dependent elements to change
 */
GlassLab.UIElement = function(game, x, y, spriteName)
{
    Phaser.Sprite.prototype.constructor.call(this, game, x, y, spriteName);

    this.events.uiChanged = new Phaser.Signal();
};

// Extends Sprite
GlassLab.UIElement.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UIElement.prototype.constructor = GlassLab.UIElement;

GlassLab.UIElement.prototype._signalChange = function()
{
    this.events.uiChanged.dispatch(this);
};