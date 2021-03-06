/**
 * Created by Rose Abernathy on 2/19/2015.
 */

GlassLab.DraggableComponent = function(game, sprite) {
    this.game = game;
    this.sprite = sprite;

    // Note that if you use this class with graphics, you have to specify the hitArea for input to work correctly
    this.sprite.inputEnabled = true;
    this.sprite.input.customHoverCursor = "grab_open";

    this.customDragCursor = "grab_closed"; // overwrite this to change what cursor is used for dragging

    this.sprite.events.onInputDown.add(this._onDown, this);
    GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.events = {};
    this.events.onStartDrag = new Phaser.Signal(); // signal is sent when the drag starts
    this.events.onEndDrag = new Phaser.Signal(); // signal is sent when the drag ends
    this.events.onDrag = new Phaser.Signal(); // whenever the dragged object is moved

    this.active = true; // can be switched off
    this.dragging = false;
    this.dragStartPoint = null;
    this.mouseOffset = null;
    this.moved = false;

    this.snap = false; // if true, we center over the mouse instead of keeping an offset
    this.dynamicParents = false; // if true, we recalculate the scale & position of all the parents every update. Should be false mostly. (I don't think this works as intended at the moment, but it's not being used at the moment)
    this.clickLeeway = 20; // how much we allow them to move the mouse within a click before it's counted as a drag
    this.showDropTarget = false;

    if (GLOBAL.gameInitialized) {
        this._onInitGame();
    } else {
        GlassLab.SignalManager.gameInitialized.addOnce(this._onInitGame, this);
    }

    this.sprite.events.onDestroy.add(function() { GLOBAL.cursorManager.unrequestCursor(this); }, this);
};

GlassLab.DraggableComponent.prototype._onInitGame = function() {
    this.game.input.onUp.add(this._onUp, this); // wait until now to add the global input listener. It gets wiped between states.
    // we use a global input listener because it lets us use auto drag (start dragging something even if we didn't actually mouse down on it)
};

GlassLab.DraggableComponent.prototype.setActive = function(active) {
    this.active = active;
    this.sprite.input.customHoverCursor = (active)? "grab_open" : null;
};

GlassLab.DraggableComponent.prototype.remove = function() {
    this.sprite.events.onInputUp.remove(this._onUp, this);
    this.sprite.events.onInputDown.remove(this._onDown, this);
    GlassLab.SignalManager.update.remove(this._onUpdate, this);
    this.events.onStartDrag.dispose();
    this.events.onEndDrag.dispose();
    this.events.onDrag.dispose();
};

GlassLab.DraggableComponent.prototype._onDown = function(sprite, pointer) {
    if (this.active && !GLOBAL.dragTarget && !this.dragging) this._startDrag(pointer);
};

GlassLab.DraggableComponent.prototype._onUp = function(sprite, pointer) {
    if (this.dragging) {
        if (this.stickyDrag) this._endDrag(); // they finished their 2nd click which ends sticky drag
        else {
            var pos = new Phaser.Point(this.game.input.activePointer.x, this.game.input.activePointer.y);
            var dist = this.dragStartMousePos.distance(pos);
            //console.log(dist, dist >= this.clickLeeway);
            if (dist >= this.clickLeeway) { // they held the mouse down and moved it, so it's normal drag and drop behavior
                this._endDrag();
            } else {
                this.stickyDrag = true; // they clicked without moving, so start sticky drag
            }
        }
    }
};


GlassLab.DraggableComponent.prototype._onUpdate = function() {
    if (this.dragging) {
        var mousePoint = this.getCurrentMousePos( this.dynamicParents ); // only recalculate adjustments if the parent might have moved

        if (this.prevPos) {
            this.events.onDrag.dispatch(mousePoint, Phaser.Point.subtract(mousePoint, this.prevPos));
        }
        this.prevPos = new Phaser.Point(mousePoint.x, mousePoint.y);
    }
};

GlassLab.DraggableComponent.prototype.getCurrentMousePos = function(recalculateAdjustments) {
    var mousePoint = new Phaser.Point(this.game.input.activePointer.x, this.game.input.activePointer.y);

    if (recalculateAdjustments) this._calculateAdjustments(); // else, continue to use the adjustment we calculated when starting drag

    Phaser.Point.add(mousePoint, this.positionAdjustment, mousePoint); // adjust the position to account for parent positions
    Phaser.Point.multiply(mousePoint, this.scaleAdjustment, mousePoint); // scale to account for parent scales
    Phaser.Point.add(mousePoint, this.mouseOffset, mousePoint); // add the initial mouse offset (will be 0 if snap is on)

    return mousePoint;
};

GlassLab.DraggableComponent.prototype.tryStartDrag = function() {
    if (this.active && !GLOBAL.dragTarget && !this.dragging) this._startDrag();
};

GlassLab.DraggableComponent.prototype._startDrag = function(pointer) {

    if (this.sprite instanceof Phaser.Plugin.Isometric.IsoSprite) this.dragStartPoint = new Phaser.Point(this.sprite.isoX, this.sprite.isoY);
    else this.dragStartPoint = new Phaser.Point(this.sprite.x, this.sprite.y);
    this.dragStartMousePos = new Phaser.Point(this.game.input.activePointer.x, this.game.input.activePointer.y); // used to check for sticky click vs normal drag
    this._calculateAdjustments(); // calculate the parent's position/scale once per drag
    this.dragging = true;
    GLOBAL.dragTarget = this;
    this.stickyDrag = false;
    this.events.onStartDrag.dispatch();
    GLOBAL.cursorManager.requestCursor(this, this.customDragCursor);
};

GlassLab.DraggableComponent.prototype._endDrag = function() {
    this.dragging = false;
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null; // it should be this, but check just in case so we don't screw up something else

    this.events.onEndDrag.dispatch();
    GLOBAL.cursorManager.unrequestCursor(this, this.customDragCursor);
};

// When we start dragging, we need to check for position and scale of parents in order to stay attached to the mouse
GlassLab.DraggableComponent.prototype._calculateAdjustments = function() {
    this.positionAdjustment = new Phaser.Point(0, 0);
    var sprite = this.sprite.parent;
    while (sprite && sprite.position) {
        Phaser.Point.subtract(this.positionAdjustment, sprite.position, this.positionAdjustment);
        sprite = sprite.parent;
    }

    this.scaleAdjustment = new Phaser.Point(1, 1);
    sprite = this.sprite.parent;
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

        this.mouseOffset = Phaser.Point.subtract(this.sprite.position, mousePoint);
    }

};