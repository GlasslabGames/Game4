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

    this.events.onDrop = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onStartDrag = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onEndDrag = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it

    this.draggable = true; // can be switched off
    this.dragging = false;
    this.dragStartPoint = null;
    this.mouseOffset = null;

    this.dropValidator = function(target) { return true; }; // overwrite this with a custom function
    this.destroyOnSuccessfulDrop = false; // if true, if we're able to validate the drop, destroy ourselves
    this.snap = false; // if true, we center over the mouse instead of keeping an offset
};

GlassLab.UIDraggable.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIDraggable.prototype.constructor = GlassLab.UIDraggable;

GlassLab.UIDraggable.prototype._onDestroy = function() {
    GlassLab.UIElement.prototype._onDestroy.call(this);
    GlassLab.SignalManager.update.remove(this._onUpdate, this);
    this.events.onDrop.dispose();
    this.events.onStartDrag.dispose();
    this.events.onEndDrag.dispose();
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
        // TODO: deal with scaled/offset parents
        this.x = this.game.input.activePointer.x + this.mouseOffset.x;
        this.y = this.game.input.activePointer.y + this.mouseOffset.y;
    }
};

GlassLab.UIDraggable.prototype._canDrag = function() {
    return this.draggable && !GLOBAL.dragTarget; // only allow one obj to be dragged at once
};

// Return whether this can be dropped onto the specified target
GlassLab.UIDraggable.prototype.canDropOnto = function(target) {
    return (this.dropValidator && this.dropValidator(target));
};

GlassLab.UIDraggable.prototype._startDrag = function(pointer) {
    this.dragStartPoint = new Phaser.Point(this.x, this.y);
    this.mouseOffset = (this.snap? new Phaser.Point() : new Phaser.Point(this.x - pointer.x, this.y - pointer.y));
    this.dragging = true;
    GLOBAL.dragTarget = this;
    this._applyDragEffect();
    this.events.onStartDrag.dispatch();
};

GlassLab.UIDraggable.prototype._endDrag = function() {
    this.dragging = false;
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null; // it should be this, but check just in case so we don't screw up something else
    this._removeDragEffect();
    this.events.onEndDrag.dispatch();

    var target = GLOBAL.UIManager.getDragTarget(this);
    if (!target) {
        // fly back to the starting place
        if (!this.returnTween) this.returnTween = this.game.add.tween(this).to( {x: this.dragStartPoint.x, y: this.dragStartPoint.y}, 500, Phaser.Easing.Cubic.Out);
        this.returnTween.start();
    } else {
        target.drop(this);
        this.events.onDrop.dispatch(target);
        if (this.destroyOnSuccessfulDrop) this.destroy();
    }
};

GlassLab.UIDraggable.prototype.OnStickyDrop = function () { // called by (atm) prototype.js
    this._endDrag();
};

// children can override this to add or replace this functionality. For now just scale up a little.
GlassLab.UIDraggable.prototype._applyDragEffect = function() {
    this.scale.x *= 1.05;
    this.scale.y *= 1.05;
};

// children can override this to add more functionality.
GlassLab.UIDraggable.prototype._removeDragEffect = function() {
    this.scale.x /= 1.05;
    this.scale.y /= 1.05;
};