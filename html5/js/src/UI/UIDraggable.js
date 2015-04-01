/**
 * Created by Rose Abernathy on 2/19/2015.
 */

GlassLab.UIDraggable = function(game) {
    GlassLab.UIElement.prototype.constructor.call(this, game);

    // Note that if you use this class with graphics, you have to specify the hitArea for input to work correctly
    this.inputEnabled = true;
    this.input.priorityID = GLOBAL.UIpriorityID;
    this.events.onInputUp.add(this._onUp, this);
    this.events.onInputDown.add(this._onDown, this);
    GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.events.onDrop = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onStartDrag = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onEndDrag = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onDrag = new Phaser.Signal(); // whenever the dragged object is moved

    this.draggable = true; // can be switched off
    this.dragging = false;
    this.dragStartPoint = null;
    this.mouseOffset = null;
    this.moved = false;

    this.dropValidator = function(target) { return true; }; // overwrite this with a custom function
    this.destroyOnSuccessfulDrop = false; // if true, if we're able to validate the drop, destroy ourselves
    this.snap = false; // if true, we center over the mouse instead of keeping an offset
    this.dynamicParents = false; // if true, we recalculate the scale & position of all the parents every update. Should be false mostly. (I don't think this works as intended at the moment, but it's not being used at the moment)
    this.clickLeeway = 5; // how much we allow them to move the mouse within a click before it's counted as a drag
    this.dontMoveWhileDragging = false; // this is a little weird, but if this is set to true, we don't actually follow the mouse, just send the start and stop drag events
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
    if (!this.dragging && !GLOBAL.dragTarget) this._startDrag(pointer);
};

GlassLab.UIDraggable.prototype._onUp = function(sprite, pointer) {
    if (this.dragging) {
        if (this.moved) { // they held the mouse down and moved it, so it's normal drag and drop behavior
            this._endDrag();
        } else {
            this.stickyDrag = true; // we clicked without moving, so start sticky drag
        }
    }
};

GlassLab.UIDraggable.prototype._onUpdate = function() {
    if (this.dragging) {
        var mousePoint = new Phaser.Point(this.game.input.activePointer.x, this.game.input.activePointer.y);

        // check if the mouse moved from the last update
        if (!this.moved && this.prevMousePos) {
            var distance = mousePoint.distance(this.prevMousePos);
            if (distance > this.clickLeeway) this.moved = true;
        }
        this.prevMousePos = new Phaser.Point(mousePoint.x, mousePoint.y);

        if (this.dontMoveWhileDragging) return; // in this case, we just want to know when we start and stop dragging, not actually do the movement

        if (this.dynamicParents) this._calculateAdjustments(); // else, continue to use the adjustment we calculated when starting drag

        Phaser.Point.add(mousePoint, this.positionAdjustment, mousePoint); // adjust the position to account for parent positions
        Phaser.Point.multiply(mousePoint, this.scaleAdjustment, mousePoint); // scale to account for parent scales
        Phaser.Point.add(mousePoint, this.mouseOffset, mousePoint); // add the initial mouse offset (will be 0 if snap is on)

        this.x = mousePoint.x;
        this.y = mousePoint.y;

        if (this.prevPos) {
            this.events.onDrag.dispatch(Phaser.Point.subtract(mousePoint, this.prevPos));
        }
        this.prevPos = new Phaser.Point(mousePoint.x, mousePoint.y);
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
    this._calculateAdjustments(); // calculate the parent's position/scale once per drag
    this.dragging = true;
    GLOBAL.dragTarget = this;
    this.moved = false;
    this.stickyDrag = false;
    this.prevMousePos = null;
    this._applyDragEffect();
    this.events.onStartDrag.dispatch();
    GLOBAL.audioManager.playSound("click");
};

GlassLab.UIDraggable.prototype._endDrag = function() {
    this.dragging = false;
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null; // it should be this, but check just in case so we don't screw up something else
    this._removeDragEffect();

    var target = GLOBAL.UIManager.getDragTarget(this);
    this.events.onEndDrag.dispatch(target);

    if (!target) {
        // fly back to the starting place
        if (!this.returnTween) this.returnTween = this.game.add.tween(this).to( {x: this.dragStartPoint.x, y: this.dragStartPoint.y}, 500, Phaser.Easing.Cubic.Out);
        this.returnTween.start();
    } else {
        target.drop(this);
        this.events.onDrop.dispatch(target);
        if (this.destroyOnSuccessfulDrop) this.destroy();
    }
    GLOBAL.audioManager.playSound("click");

};

GlassLab.UIDraggable.prototype.OnStickyDrop = function () { // called by UIManager
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

// When we start dragging, we need to check for position and scale of parents in order to stay attached to the mouse
GlassLab.UIDraggable.prototype._calculateAdjustments = function() {
    this.positionAdjustment = new Phaser.Point(0, 0);
    var sprite = this.parent;
    while (sprite && sprite.position) {
        Phaser.Point.subtract(this.positionAdjustment, sprite.position, this.positionAdjustment);
        sprite = sprite.parent;
    }

    this.scaleAdjustment = new Phaser.Point(1, 1);
    sprite = this.parent;
    while (sprite && sprite.scale) {
        Phaser.Point.divide(this.scaleAdjustment, sprite.scale, this.scaleAdjustment);
        sprite = sprite.parent;
    }

    if (this.snap) {
        this.mouseOffset = new Phaser.Point(); // don't remember any offset so that object snaps to the middle of the mouse
    } else {
        // Calculate the offset in local coordinates
        var mousePoint = new Phaser.Point(this.game.input.activePointer.x, this.game.input.activePointer.y);
        Phaser.Point.add(mousePoint, this.positionAdjustment, mousePoint);
        Phaser.Point.multiply(mousePoint, this.scaleAdjustment, mousePoint);

        this.mouseOffset = Phaser.Point.subtract(this.position, mousePoint);
    }

};