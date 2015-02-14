/**
 * Created by Rose Abernathy on 2/13/2015.
 */

GlassLab.UIDragTarget = function(game, width, height, hint) {
    GlassLab.UIElement.prototype.constructor.call(this, game);
    this.game = game;

    this.actualWidth = width;
    this.actualHeight = height;

    this.enabled = true;
    this.highlighted = false;

    this.graphics = game.make.graphics();
    this.addChild(this.graphics);

    if (hint) {
        var dragHint = game.make.text(width / 2, height / 2, hint, {fill: "#444444", font: "20px Arial"});
        dragHint.anchor.setTo(0.5, 0.5);
        this.addChild(dragHint);
    }

    this._redraw();

    this.objectValidator = function(obj) { return false; }; // overwrite this with a custom function
    this.objectsOver = []; // objects being dragged over
    this.objectsOn = []; // objects dropped on

    // settings
    this.maxObjects = 1;
    this.replace = true;
    this.addObjectAsChild = true;

    this.events.onObjectDropped = new Phaser.Signal();
    GLOBAL.UIManager.dragTargets.push( this );
    this.events.onDestroy.add(this._onDestroy, this);
};

GlassLab.UIDragTarget.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIDragTarget.prototype.constructor = GlassLab.UITextInput;

GlassLab.UIDragTarget.prototype._onDestroy = function() {
    GLOBAL.UIManager.dragTargets.splice( GLOBAL.UIManager.dragTargets.indexOf(this), 1 );
}

GlassLab.UIDragTarget.prototype.tryDragOver = function(obj) {
  if (this.objectValidator && this.objectValidator(obj) && (this.objectsOn.length < this.maxObjects || this.replace)) {
      this.setHighlighted(true);
      this.objectsOver.push(obj);
      return true;
  } else return false;
};

GlassLab.UIDragTarget.prototype.tryDragOut = function(obj) {
    var index = this.objectsOver.index(obj);
    if (index > -1) this.objectsOver.splice(index, 1);
    this.setHighlighted(this.objectsOver.length > 0);
};

GlassLab.UIDragTarget.prototype.tryDrop = function(obj) {
    // due to graphics not working with bounds, we need to check directly for overlap
    if (this._checkOverlap(obj.sprite || obj) && this.objectValidator && this.objectValidator(obj) && (this.objectsOn.length < this.maxObjects || this.replace)) {
        if (this.objectsOn.length < this.maxObjects) {
            this._addObject(obj);
            return true;
        } else if (this.replace) {
            this._removeObject(this.objectsOn.shift());
            this._addObject(obj);
            return true;
        }
    }
    return false;
};

GlassLab.UIDragTarget.prototype._checkOverlap = function(sprite) {
    if (!sprite.getBounds) return false;
    var objBounds = sprite.getBounds();
    var center = new Phaser.Point(objBounds.x + objBounds.width / 2, objBounds.y + objBounds.height / 2);
    var myBounds = this.getBounds();
    var scaleX = this.scale.x;
    var parent = this.parent;
    while (parent && parent.scale) {
        scaleX *= parent.scale.x;
        parent = parent.parent;
    }
    var overlap = (center.x >= myBounds.x && center.y >= myBounds.y &&
        center.x <= myBounds.x + this.actualWidth * scaleX
        && center.y <= myBounds.y + this.actualHeight * scaleX);
    return overlap;
};

GlassLab.UIDragTarget.prototype._addObject = function(obj) {
    this.objectsOn.push(obj);
    console.log(obj, "added");
    if (this.addObjectAsChild) {
        var sprite = obj.sprite || obj;
        sprite.parent = this;
        sprite.x = 0; sprite.y = 0;
    }
    this.events.onObjectDropped.dispatch(obj, this);
};

GlassLab.UIDragTarget.prototype._removeObject = function(obj) {
    var index = this.objectsOn.indexOf(obj);
    if (index > -1) {
        this.objectsOn.splice(index, 1);
        console.log(obj, "removed");
    }
};

GlassLab.UIDragTarget.prototype._redraw = function() {
    this.graphics.clear();
    this.graphics.beginFill(this.highlighted? 0x444444 : 0xffffff).drawRect(0,0,this.actualWidth,this.actualHeight);
    this.graphics.lineStyle(3, (this.enabled? 0x000000 : 0xbbbbbb), 1);
    var dashLen = 10;
    for (var x = 0; x < this.actualWidth; x += dashLen * 2) {
        this.graphics.moveTo(x, 0).lineTo(x + dashLen, 0);
        this.graphics.moveTo(x, this.actualHeight).lineTo(x + dashLen, this.actualHeight);
    }
    for (var y = 0; y < this.actualHeight; y += dashLen * 2) {
        this.graphics.moveTo(0, y).lineTo(0, y + dashLen);
        this.graphics.moveTo(this.actualWidth, y).lineTo(this.actualWidth, y + dashLen);
    }
};

GlassLab.UIDragTarget.prototype.setEnabled = function(enabled) {
    if (this.enabled != enabled) {
        this.enabled = enabled;
        this._redraw();
    }
};

GlassLab.UIDragTarget.prototype.setHighlighted = function(highlighted) {
    if (this.highlighted != highlighted) {
        this.highlighted = highlighted;
        this._redraw();
    }
};
