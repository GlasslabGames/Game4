/**
 * Created by Rose Abernathy on 2/19/2015.
 */

GlassLab.UIDraggable = function(game) {
    GlassLab.UIElement.prototype.constructor.call(this, game);

    // Note that if you use this class with graphics, you have to specify the hitArea for input to work correctly
    this.draggableComponent = new GlassLab.DraggableComponent(game, this);
    this.draggableComponent.events.onDrag.add(this._onComponentDragged, this);
    this.draggableComponent.events.onStartDrag.add(this._onStartDraggingComponent, this);
    this.draggableComponent.events.onEndDrag.add(this._onEndDraggingComponent, this);

    this.events.onDrop = new Phaser.Signal(); // signal is sent when this is dropped on a target that wants it
    this.events.onStartDrag = new Phaser.Signal();
    this.events.onEndDrag = new Phaser.Signal();

    this.dropValidator = function(target) { return true; }; // overwrite this with a custom function
    this.destroyOnSuccessfulDrop = false; // if true, if we're able to validate the drop, destroy ourselves

    this._is_dragging = false;
    this._at_start_point = true;
};

GlassLab.UIDraggable.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIDraggable.prototype.constructor = GlassLab.UIDraggable;

GlassLab.UIDraggable.prototype._onDestroy = function() {
    GlassLab.UIElement.prototype._onDestroy.call(this);
    this.draggableComponent.remove();
    this.events.onDrop.dispose();
    this.events.onStartDrag.dispose();
    this.events.onEndDrag.dispose();
};

GlassLab.UIDraggable.prototype._onComponentDragged = function(mousePoint, diff) {
    this.x = mousePoint.x;
    this.y = mousePoint.y;
};

// Return whether this can be dropped onto the specified target
GlassLab.UIDraggable.prototype.canDropOnto = function(target) {
    return (this.dropValidator && this.dropValidator(target));
};

GlassLab.UIDraggable.prototype._onStartDraggingComponent = function() {
    this._applyDragEffect();
    GLOBAL.audioManager.playSound("clickSound");
    this._at_start_point = false; // move to onDragged?
    this._is_dragging = true;

    this.events.onStartDrag.dispatch();
};

GlassLab.UIDraggable.prototype._onEndDraggingComponent = function() {
    this._removeDragEffect();
    GLOBAL.audioManager.playSound("clickSound");

    var target = GLOBAL.UIManager.getDragTarget(this);
    this.events.onEndDrag.dispatch(target);
    this._is_dragging = false;

    if (!target) {
        // fly back to the starting place
        var start = this.draggableComponent.dragStartPoint;
        if (!this.returnTween) {
            this.returnTween = this.game.add.tween(this).to( {x: start.x, y: start.y}, 500, Phaser.Easing.Cubic.Out);
            this.returnTween.onComplete.add(function() { this._at_start_point = true; }, this);
        }
        this.returnTween.start();
    } else {
        target.drop(this);
        this.events.onDrop.dispatch(target);
        if (this.destroyOnSuccessfulDrop) this.destroy();
    }

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