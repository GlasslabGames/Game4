/**
 * Created by Rose Abernathy on 2/13/2015.
 */

GlassLab.UIDragTarget = function(game, width, height, hint, solidLines) {
    GlassLab.UIElement.prototype.constructor.call(this, game);
    this.game = game;

    this.actualWidth = width;
    this.actualHeight = height;
    this.hitArea = new Phaser.Rectangle(0, 0, width, height); // Note, if you extend this and redraw it, make sure to set the hitArea!

    this.enabled = true;
    this.highlighted = false;
    this.dashedLines = !solidLines;

    this.graphics = game.make.graphics();
    this.addChild(this.graphics);

    if (hint) {
        var dragHint = game.make.text(width / 2, height / 2, hint, {fill: "#444444", font: "16px Arial"});
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
    this.childObjectOffset = new Phaser.Point();

    this.events.onObjectDropped = new Phaser.Signal();
    GLOBAL.UIManager.dragTargets.push( this );
};

GlassLab.UIDragTarget.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIDragTarget.prototype.constructor = GlassLab.UIDragTarget;

GlassLab.UIDragTarget.prototype._onDestroy = function() {
    GlassLab.UIElement.prototype._onDestroy.call(this);
    GLOBAL.UIManager.dragTargets.splice( GLOBAL.UIManager.dragTargets.indexOf(this), 1 );
    this.events.onObjectDropped.dispose();
};

// Return whether the specified object can be dropped onto this target
GlassLab.UIDragTarget.prototype.canDrop = function(obj) {
    return (this.objectValidator && this.objectValidator(obj) && (this.objectsOn.length < this.maxObjects || this.replace));
};

/* TODO
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
*/

GlassLab.UIDragTarget.prototype.drop = function(obj) {
    if (this.objectsOn.length < this.maxObjects) {
        this._addObject(obj);
    } else if (this.replace) {
        this._removeObject(this.objectsOn.shift());
        this._addObject(obj);
    }
};

GlassLab.UIDragTarget.prototype._checkOverlap = function(sprite) {
    // TODO: revise this to be cleaner using hitArea
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
    //console.log(obj, "added");
    if (this.addObjectAsChild) {
        var sprite = obj.sprite || obj;
        sprite.parent = this;
        sprite.x = this.childObjectOffset.x;
        sprite.y = this.childObjectOffset.y;
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
    if (this.dashedLines) {
        this.graphics.beginFill(this.highlighted? 0x444444 : 0xffffff).drawRect(0,0,this.actualWidth,this.actualHeight);
        this.graphics.lineStyle(2, (this.enabled? 0x000000 : 0xbbbbbb), 1);
        var dashLen = 10;
        for (var x = 0; x < this.actualWidth; x += dashLen * 2) {
            this.graphics.moveTo(x, 0).lineTo(x + dashLen, 0);
            this.graphics.moveTo(x, this.actualHeight).lineTo(x + dashLen, this.actualHeight);
        }
        for (var y = 0; y < this.actualHeight; y += dashLen * 2) {
            this.graphics.moveTo(0, y).lineTo(0, y + dashLen);
            this.graphics.moveTo(this.actualWidth, y).lineTo(this.actualWidth, y + dashLen);
        }
    } else {
        this.graphics.lineStyle(3, (this.enabled? 0x000000 : 0xbbbbbb), 1).beginFill(this.highlighted? 0x444444 : 0xffffff).drawRect(0,0,this.actualWidth,this.actualHeight);
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
