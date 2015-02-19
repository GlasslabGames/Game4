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
    this.hasFocus = false;

    this.events.uiChanged = new Phaser.Signal();
    this.focusChangedHandler = GlassLab.SignalManager.uiFocusChanged.add(this._onUIFocusChanged, this);

    this.events.onDestroy.add(this._onDestroy, this);
};

// Extends Sprite
GlassLab.UIElement.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UIElement.prototype.constructor = GlassLab.UIElement;

GlassLab.UIElement.prototype._onDestroy = function()
{
    this.SetFocus(false);
    this.focusChangedHandler.detach();
    this.events.uiChanged.dispose();
};

GlassLab.UIElement.prototype._signalChange = function()
{
    this.events.uiChanged.dispatch(this);
};

// Call this to focus or unfocus this element. Subclasses shouldn't have to override this.
GlassLab.UIElement.prototype.SetFocus = function(onOrOff)
{
    if (this.hasFocus != onOrOff) {
        var targetElement = (onOrOff)? this : null;
        GlassLab.SignalManager.uiFocusChanged.dispatch(targetElement); // tell all UIElements that this one has focus now
    }
};

// This will be triggered by the uiFocusChanged signal. Subclasses shouldn't have to override this.
GlassLab.UIElement.prototype._onUIFocusChanged = function(focusedElement)
{
    var hasFocus = (focusedElement == this);
    if (hasFocus != this.hasFocus) {
        this.hasFocus = hasFocus;

        // this isn't currently used, but maybe we'll need it in the future
        /*
        if (this.hasFocus) GLOBAL.UIManager.focusedElement = this;
        else if (GLOBAL.UIManager.focusedElement == this) GLOBAL.UIManager.focusedElement = null;
        */

        this._onFocusChanged();
    }
};

// This will be deal with the results of this element actually changing focus, so subclasses should override it.
GlassLab.UIElement.prototype._onFocusChanged = function() {};

// If we've specified an "actual width" (like when we're using graphics), use that. Otherwise try the width property.
GlassLab.UIElement.prototype.getWidth = function() {
    return this.actualWidth || this.width;
};

GlassLab.UIElement.prototype.getHeight = function() {
    return this.actualHeight || this.height;
};