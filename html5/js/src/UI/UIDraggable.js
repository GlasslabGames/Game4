/**
 * Created by Rose Abernathy on 2/19/2015.
 */

GlassLab.UIDraggable = function(game) {
    GlassLab.UIElement.prototype.constructor.call(this, game);

    // Note that if you use this class with graphics, you have to specify the hitArea for input to work correctly
    this.inputEnabled = true;
    this.events.onInputUp.add(this._onUp, this);
    this.events.onInputDown.add(this._onDown, this);
    GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.draggable = true; // can be switched off
    this.dragging = false;
    this.dragStartPoint = null;
    this.mouseOffset = null;

    this.dropValidator = function(obj) { return true; }; // overwrite this with a custom function
    this.destroyOnSuccessfulDrop = false; // if true, if we're able to validate the drop, destroy ourselves
    this.snap = false; // if true, we center over the mouse instead of keeping an offset
};

GlassLab.UIDraggable.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIDraggable.prototype.constructor = GlassLab.UIDraggable;

GlassLab.UIDraggable.prototype._onDestroy = function() {
    GlassLab.UIElement.prototype._onDestroy.call(this);
    GlassLab.SignalManager.update.remove(this._onUpdate, this);
};

GlassLab.UIDraggable.prototype._onDown = function(sprite, pointer) {
    if (!GLOBAL.stickyMode) {
        if (this._canDrag()) this._startDrag(pointer); // in normal mode, start dragging when we press the mouse
    } else {
        // for stickyMode, track if we were dragging when we pressed the mouse down
        this.mouseDownWhileDragging = this.dragging;
    }
};

GlassLab.UIDraggable.prototype._onUp = function(sprite, pointer) {
    if (!GLOBAL.stickyMode) {
        if (this.dragging) this._endDrag(); // in normal mode, end dragging after we release the mouse
    } else {
        if (this._canDrag() && !this.mouseDownWhileDragging) this._startDrag(pointer); // in stickyMode, start dragging after we click
        // unless mouseDownWhileDragging is true = prevent restarting a drag that was just finished by the global OnStickyDrop
    }
};

GlassLab.UIDraggable.prototype._onUpdate = function() {
    if (this.dragging) {
        this.x = this.game.input.activePointer.x + this.mouseOffset.x;
        this.y = this.game.input.activePointer.y + this.mouseOffset.y;
    }
};

GlassLab.UIDraggable.prototype._canDrag = function() {
    return this.draggable && !GLOBAL.dragTarget; // only allow one obj to be dragged at once
};

GlassLab.UIDraggable.prototype._startDrag = function(pointer) {
    this.dragStartPoint = new Phaser.Point(this.x, this.y);
    this.mouseOffset = (this.snap? new Phaser.Point() : new Phaser.Point(this.x - pointer.x, this.y - pointer.y));
    this.dragging = true;
    GLOBAL.dragTarget = this;
    this._onStartDrag();
};

GlassLab.UIDraggable.prototype._endDrag = function() {
    this.dragging = false;
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null; // it should be this, but check just in case so we don't screw up something else
    var success = this.dropValidator(this); // check if drop was successful
    this._onEndDrag(success);
    if (!success) {
        // fly back to the starting place
        if (!this.returnTween) this.returnTween = this.game.add.tween(this).to( {x: this.dragStartPoint.x, y: this.dragStartPoint.y}, 500, Phaser.Easing.Cubic.Out);
        this.returnTween.start();
    } else if (this.destroyOnSuccessfulDrop) {
        this.destroy();
    }
};

GlassLab.UIDraggable.prototype.OnStickyDrop = function () { // called by (atm) prototype.js
    this._endDrag();
};

// children can override this to add more functionality. For now just scale up a little.
GlassLab.UIDraggable.prototype._onStartDrag = function() {
    this.scale.x *= 1.05;
    this.scale.y *= 1.05;
};

// children can override this to add more functionality. For now just scale up a little.
GlassLab.UIDraggable.prototype._onEndDrag = function(success) {
    this.scale.x /= 1.05;
    this.scale.y /= 1.05;
};