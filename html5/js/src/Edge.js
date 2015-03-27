/**
 * Created by Rose Abernathy on 3/4/2015.
 */

GlassLab = GlassLab || {};

/**
 * Edge - represents the edge of a pen, made up of multiple sprites
 */
GlassLab.Edge = function(pen, side, sideIndex) {
    this.game = pen.game;
    this.side = side;
    this.sideIndex = sideIndex; // all the right pieces have an index to identify their positions
    this.pen = pen;
    this.sprite = this.game.make.isoSprite();
    this.sprite.name = side + "Edge";
    this.pieces = this.game.make.sprite();
    this.sprite.addChild(this.pieces);

    if (side == GlassLab.Edge.SIDES.top || side == GlassLab.Edge.SIDES.bottom) {
        this.horizontal = true;
    } else {
        this.horizontal = false;
    }

    this.arrow = this.game.make.isoSprite(0, 0, 0, (side == GlassLab.Edge.SIDES.top || side == GlassLab.Edge.SIDES.left)? "penArrowUp" : "penArrowDown");
    if (side == GlassLab.Edge.SIDES.bottom || side == GlassLab.Edge.SIDES.left) this.arrow.scale.x = -1;
    this.sprite.addChild(this.arrow);
    this.arrow.anchor.setTo(0.5, 0.5);
    this.arrowTween = this.game.add.tween(this.arrow).to( { alpha: 0.5 }, 500, Phaser.Easing.Quadratic.InOut, true, 0, 150, true);
    this._setInputHandlers(this.arrow);

    this.draggable = true;
    this.dragging = false;
    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.cursors = this.game.input.keyboard.createCursorKeys(); // for testing
};

GlassLab.Edge.prototype.Reset = function() {
    this.unusedSprites = [];
    for (var i = 0; i < this.pieces.children.length; i++) {
        this.unusedSprites.push(this.pieces.children[i]);
        this.pieces.children[i].visible = false;
    }
    if (this.horizontal) {
        this.sprite.isoY = 0;
    } else {
        this.sprite.isoX = 0;
    }
};

GlassLab.Edge.SIDES = { top: "top", bottom: "bottom", left: "left", right: "right", center: "center" }; // enum

// add a new piece or recycle one
GlassLab.Edge.prototype.PlacePiece = function(col, row, atlasName, spriteName, anchor) {
    return this.PlacePieceAt(col * GLOBAL.tileSize, row * GLOBAL.tileSize, atlasName, spriteName, anchor);
};

GlassLab.Edge.prototype.PlacePieceAt = function(x, y, atlasName, spriteName, anchor) {
    var sprite = this.unusedSprites.pop();
    if (!sprite) {
        sprite = this.game.make.isoSprite(0, 0, 0, atlasName, spriteName);
        this._setInputHandlers(sprite);
        switch (this.side) {
            case GlassLab.Edge.SIDES.top: sprite.input.priorityID = 1; break;
            case GlassLab.Edge.SIDES.left: sprite.input.priorityID = 2; break;
            case GlassLab.Edge.SIDES.bottom: sprite.input.priorityID = 4; break;
            default: sprite.input.priorityID = 3; break;
        } // Note: We might have to revisit and/or add priorityIDs to other things.
        this.pieces.addChild(sprite);
    }
    sprite.visible = true;
    if (sprite.spriteName != spriteName) sprite.loadTexture(atlasName, spriteName);
    if (anchor) sprite.anchor.set(anchor.x, anchor.y);
    sprite.isoX = x;
    sprite.isoY = y;



    sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1); // move it to the back of the children so far

    return sprite;
};

GlassLab.Edge.prototype._setInputHandlers = function(sprite) {
    sprite.inputEnabled = true;
    sprite.input.pixelPerfectOver = true;
    sprite.input.pixelPerfectClick = true;
    sprite.events.onInputUp.add(this._onUp, this);
    sprite.events.onInputDown.add(this._onDown, this);
    sprite.events.onInputOver.add(this._onOver, this);
    sprite.events.onInputOut.add(this._onOut, this);
};

GlassLab.Edge.prototype.showArrow = function(visible) {
    this.arrow.visible = visible;

    if (visible) this.arrowTween.resume();
    else this.arrowTween.pause();
};

GlassLab.Edge.prototype.placeArrow = function(col, row) {
    if (!this.arrow.visible) return;

    if (this.side == GlassLab.Edge.SIDES.top) {
        row -= 1.5;
        col += 0.5;
    } else if (this.side == GlassLab.Edge.SIDES.left) {
        col -= 1;
        row += 0.5;
    } else if (this.side == GlassLab.Edge.SIDES.bottom) {
        row -= 0;
        col += 0.5;
    } else { // center / right
        col -= 0;
        row += 0.5;
    }

    this.arrow.isoX = col * GLOBAL.tileSize;
    this.arrow.isoY = row * GLOBAL.tileSize;
};

GlassLab.Edge.prototype._onDown = function( target, pointer ) {
    if (!GLOBAL.stickyMode && !this.dragging && this.draggable) {
        this._startDrag();
    }
};

GlassLab.Edge.prototype._onUp = function( target, pointer ) {
    if (this.draggable && GLOBAL.stickyMode && !GLOBAL.dragTarget && !GLOBAL.justDropped) {
        this._startDrag();
    } else if (!GLOBAL.stickyMode && GLOBAL.dragTarget == this) {
        this._endDrag();
    }
};

GlassLab.Edge.prototype._startDrag = function() {
    if (GLOBAL.dragTarget != null) return;
    this.dragging = true;
    this.initialCursorIsoPos = this.game.iso.unproject(this.game.input.activePointer.position);
    Phaser.Point.divide(this.initialCursorIsoPos, GLOBAL.WorldLayer.scale, this.initialCursorIsoPos);
    GLOBAL.dragTarget = this;
};

GlassLab.Edge.prototype.OnStickyDrop = function() { // called by (atm) prototype.js
    this._endDrag();
};

GlassLab.Edge.prototype._endDrag = function() {
    this.dragging = false;
    this.pen.SetSizeFromEdge(this);
    GLOBAL.dragTarget = null;
    this._highlight(false);
};

GlassLab.Edge.prototype._onOver = function( target, pointer ) {
    if (this.draggable) {
        this._highlight(true);
    }
};

GlassLab.Edge.prototype._onOut = function( target, pointer ) {
    if (!this.dragging) { // if we are dragging, stay highlighted
        this._highlight(false);
    }
};

GlassLab.Edge.prototype._highlight = function(on) {
    for (var i = 0; i < this.pieces.children.length; i++) {
        this.pieces.children[i].tint = (on)? 0xeebbff : 0xffffff;
    }
};

GlassLab.Edge.prototype._onUpdate = function() {
    if (this.dragging) {
        var cursorIsoPosition = this.game.iso.unproject(this.game.input.activePointer.position);
        Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
        cursorDifference = Phaser.Point.subtract(cursorIsoPosition, this.initialCursorIsoPos);
        var ts = GLOBAL.tileSize;
        var targetPos = { x: this.sprite.isoX, y: this.sprite.isoY };
        var closestGridPos, flooredGridPos; // flooredGrid is the gridline closest to the center of the pen

        // I'm not sure if we want to have the edge stick to the grid yet, so do the calculations for both
        switch (this.side) {
            case GlassLab.Edge.SIDES.top:
                targetPos.y = Math.min( cursorDifference.y, (this.pen.height - 1) * ts);
                if (this.pen.maxHeight) {
                    targetPos.y = Math.max( targetPos.y, (this.pen.height - this.pen.maxHeight) * ts);
                }
                closestGridPos = Math.round(targetPos.y / ts);
                flooredGridPos = Math.ceil(targetPos.y / ts);
                break;
            case GlassLab.Edge.SIDES.bottom:
                targetPos.y = Math.max( cursorDifference.y, -(this.pen.height - 1) * ts);
                if (this.pen.maxHeight) {
                    targetPos.y = Math.min( targetPos.y, (this.pen.maxHeight - this.pen.height) * ts);
                }
                closestGridPos = Math.round(targetPos.y / ts);
                flooredGridPos = Math.floor(targetPos.y / ts);
                break;
            case GlassLab.Edge.SIDES.left:
                targetPos.x = Math.min( cursorDifference.x, (this.pen.widths[0] - 1) * ts);
                closestGridPos = Math.round(targetPos.x / ts);
                flooredGridPos = Math.ceil(targetPos.x / ts);
                break;
            case GlassLab.Edge.SIDES.center:
                targetPos.x = Math.max( cursorDifference.x, -(this.pen.widths[0] - 1) * ts);
                targetPos.x = Math.min( targetPos.x, (this.pen.widths[1] - 1) * ts);
                closestGridPos = Math.round(targetPos.x / ts);
                flooredGridPos = Math.ceil(targetPos.x / ts);
                break;
            case GlassLab.Edge.SIDES.right:
                targetPos.x = Math.max( cursorDifference.x, -(this.pen.widths[this.sideIndex + 1] - 1) * ts);
                if (this.pen.widths.length > this.sideIndex + 2) {
                    targetPos.x = Math.min( targetPos.x, (this.pen.widths[this.sideIndex + 2] - 1) * ts);
                }
                closestGridPos = Math.round(targetPos.x / ts);
                flooredGridPos = Math.ceil(targetPos.x / ts);
                break;
        }

        // allow different options for how the handles move ( ideally we could put these in the game for pepole to try)
        var lerpFactor = 0.2; // 0: no snap, 0.2: some snap, 1: full snap
        if (lerpFactor > 0) {
            if (this.horizontal) {
                this.sprite.isoY = (1 - lerpFactor) * this.sprite.isoY + lerpFactor * closestGridPos * ts;
            }
            else {
                this.sprite.isoX = (1 - lerpFactor) * this.sprite.isoX + lerpFactor * closestGridPos * ts;
            }
        } else {
            if (this.horizontal) this.sprite.isoY = targetPos.y;
            else this.sprite.isoX = targetPos.x;
        }

        // TODO: it would be nice to redraw the contents before the edge is dropped, but it's causing issues
    }
};
