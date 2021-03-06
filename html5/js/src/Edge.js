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

    /*this.sprite = this.game.make.isoSprite();
    this.sprite.name = side + "Edge";
    this.pieces = this.game.make.sprite();
    this.sprite.addChild(this.pieces);*/

    this.presetScale = 1; // overwrite this to change the scale that's set on edge

    // Each edge can have multiple parts that we want to add to the parent Pen in different places
    this.layers = []; // list of sprites that can be added to the parent in a certain order
    this.sprite = this.addLayer(); // default sprite

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
    this.arrow.edge = this; // checked by the UIRatioTooltip

    this.draggable = false;
    this.dragging = false;
    this.moved = false;
    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);
    this.unusedSprites = [];

    this.cursors = this.game.input.keyboard.createCursorKeys(); // for testing

    // TODO: we can extend DraggableComponent instead of duplicating all the code
    if (GLOBAL.gameInitialized) {
        this._onInitGame();
    } else {
        GlassLab.SignalManager.gameInitialized.addOnce(this._onInitGame, this);
    }

    this.onHighlight = new Phaser.Signal();
    this.sprite.events.onDestroy.add(function() {
        if (this.onHighlight) this.onHighlight.dispose();
        GLOBAL.cursorManager.unrequestCursor(this);
    }, this);
};

GlassLab.Edge.prototype._onInitGame = function() {
    this.game.input.onUp.add(this._onUp, this); // wait until now to add the global input listener. It gets wiped between states.
};

GlassLab.Edge.prototype.addLayer = function() {
    var sprite = this.game.make.isoSprite();
    this.layers.push(sprite);
    sprite.pieces = sprite.addChild(this.game.make.sprite());
    return sprite;
};

GlassLab.Edge.prototype.getIsInnerEdge = function() {
    return this.side == GlassLab.Edge.SIDES.center || (this.side == GlassLab.Edge.SIDES.right && this.pen.rightmostEdge != this);
};

GlassLab.Edge.prototype.Reset = function() {
    this.unusedSprites = [];
    for (var j = 0; j < this.layers.length; j++) {
        var sprite = this.layers[j];
        for (var i = 0; i < sprite.pieces.children.length; i++) {
            this.unusedSprites.push(sprite.pieces.children[i]);
            sprite.pieces.children[i].visible = false;
        }

        if (this.horizontal) {
            sprite.isoY = 0;
        } else {
            sprite.isoX = 0;
        }
    }
};

GlassLab.Edge.SIDES = { top: "top", bottom: "bottom", left: "left", right: "right", center: "center" }; // enum

// add a new piece or recycle one
GlassLab.Edge.prototype.PlacePiece = function(col, row, spriteName, frameName, anchor, flip, layerIndex) {
    return this.PlacePieceAt(col * GLOBAL.tileSize, row * GLOBAL.tileSize, spriteName, frameName, anchor, flip, layerIndex);
};

GlassLab.Edge.prototype.PlacePieceAt = function(x, y, spriteName, frameName, anchor, flip, layerIndex) {
    var sprite = this.unusedSprites.pop();
    if (!sprite) {
        sprite = this.game.make.isoSprite(0, 0, 0, spriteName, frameName);
        this._setInputHandlers(sprite, true);
        sprite.edge = this;
    }

    if (!layerIndex) layerIndex = 0;
    if (layerIndex < this.layers.length) this.layers[layerIndex].pieces.addChild(sprite);
    else this.sprite.pieces.addChild(sprite);

    sprite.visible = true;
    sprite.scale.setTo(this.presetScale, this.presetScale);
    if (flip) sprite.scale.x *= -1;
    if (sprite.key != spriteName) sprite.loadTexture(spriteName, frameName);
    sprite.frame = frameName || 0;
    if (anchor) sprite.anchor.set(anchor.x, anchor.y);
    sprite.isoX = x;
    sprite.isoY = y;
    sprite.inputEnabled = this.draggable; // reset incase this.draggable has changed

    sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1); // move it to the back of the children so far

    return sprite;
};

GlassLab.Edge.prototype._setInputHandlers = function(sprite, isEdgePiece) {
    sprite.inputEnabled = true;
    sprite.events.onInputDown.add(this._onDown, this);
    sprite.events.onInputOver.add(this._onOver, this);
    sprite.events.onInputOut.add(this._onOut, this);

    sprite.input.customHoverCursor = "grab_open";

    if (isEdgePiece) {
        if (this.horizontal || sprite.key == "dottedLine") { // the dotted line is just flipped for vertical use, so we can set the same hitArea
            var w = GLOBAL.tileSize, h = 70, slant = 60, startX = 0, startY = -40;
        } else {
            var w = GLOBAL.tileSize, h = 70, slant = -60, startX = GLOBAL.tileSize - 15, startY = 10;
        }

        var polygon = new Phaser.Polygon(
            {x: startX, y: startY},
            {x: startX + w, y: startY + slant},
            {x: startX + w, y: startY + slant + h},
            {x: startX, y: startY + h}
        );
        // sprite.addChild(this.game.make.graphics().beginFill(0x0000ff, 0.75).drawPolygon(polygon.points)); // For debugging
        sprite.hitArea = polygon;
    } else {
        sprite.input.pixelPerfectOver = true;
        sprite.input.pixelPerfectClick = true;
    }


    switch (this.side) {
        case GlassLab.Edge.SIDES.top: sprite.input.priorityID = 11; break;
        case GlassLab.Edge.SIDES.left: sprite.input.priorityID = 12; break;
        case GlassLab.Edge.SIDES.bottom: sprite.input.priorityID = 14; break;
        default: sprite.input.priorityID = 13; break;
    }
};

GlassLab.Edge.prototype.showArrow = function(visible) {
    this.arrow.visible = visible;

    /*if (visible) this.arrowTween.resume();
    else this.arrowTween.pause();*/
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

GlassLab.Edge.prototype.setDraggable = function(draggable) {
    this.draggable = draggable;

    // Set input enabled on all the child pieces
    for (var j = 0; j < this.layers.length; j++) {
        var sprite = this.layers[j];
        for (var i = 0; i < sprite.pieces.children.length; i++) {
            var piece = sprite.pieces.children[i];
            if (draggable) this._setInputHandlers(piece, true);
            else piece.inputEnabled = false;
        }
    }

    this.showArrow(draggable);
};

GlassLab.Edge.prototype.setVisible = function(visible) {
    for (var j = 0; j < this.layers.length; j++) {
        this.layers[j].visible = visible;
    }
};

GlassLab.Edge.prototype._onDown = function( target, pointer ) {
    if (this.draggable && !this.dragging && !GLOBAL.dragTarget) this._startDrag(pointer);
};

GlassLab.Edge.prototype._onUp = function( target, pointer ) {
    if (this.dragging) {
        if (this.moved) { // they held the mouse down and moved it, so it's normal drag and drop behavior
            this._endDrag();
        } else {
            this.stickyDrag = true; // we clicked without moving, so start sticky drag
        }
    }
};

GlassLab.Edge.prototype._startDrag = function() {
    if (GLOBAL.dragTarget != null) return;
    this.dragging = true;
    this.moved = false;
    this.stickyDrag = false;
    this.initialCursorIsoPos = this.game.iso.unproject(this.game.input.activePointer.position);
    Phaser.Point.divide(this.initialCursorIsoPos, GLOBAL.WorldLayer.scale, this.initialCursorIsoPos);
    GLOBAL.dragTarget = this;
    GLOBAL.cursorManager.requestCursor(this, "grab_closed");
};

GlassLab.Edge.prototype.onStickyDrop = function() { // called by (atm) prototype.js
    this._endDrag();
};

GlassLab.Edge.prototype._endDrag = function() {
    this.dragging = false;
    this.pen.SetSizeFromEdge(this);
    GLOBAL.dragTarget = null;
    this._highlight(false);
    GLOBAL.cursorManager.unrequestCursor(this, "grab_closed");
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
    for (var j = 0; j < this.layers.length; j++) {
        var pieces = this.layers[j].pieces;
        for (var i = 0; i < pieces.children.length; i++) {
            pieces.children[i].tint = (on)? 0xeebbff : 0xffffff;
        }
    }
    this.onHighlight.dispatch(on);
};

GlassLab.Edge.prototype._onUpdate = function() {
    if (this.dragging) {
        var cursorIsoPosition = this.game.iso.unproject(this.game.input.activePointer.position);
        Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
        cursorDifference = Phaser.Point.subtract(cursorIsoPosition, this.initialCursorIsoPos);
        if (cursorDifference.getMagnitudeSq() > 5) this.moved = true;
        var ts = GLOBAL.tileSize;
        var targetPos = { x: this.sprite.isoX, y: this.sprite.isoY };
        var closestGridPos, flooredGridPos; // flooredGrid is the gridline closest to the center of the pen

        // I'm not sure if we want to have the edge stick to the grid yet, so do the calculations for both
        switch (this.side) {
            case GlassLab.Edge.SIDES.top:
                targetPos.y = Math.min( cursorDifference.y, (this.pen.height - 1) * ts);
                targetPos.y = this.pen.GetValidEdgePos(this.side, this.sideIndex, targetPos.y);
                closestGridPos = Math.round(targetPos.y / ts);
                flooredGridPos = Math.ceil(targetPos.y / ts);
                break;
            case GlassLab.Edge.SIDES.bottom:
                targetPos.y = Math.max( cursorDifference.y, -(this.pen.height - 1) * ts);
                targetPos.y = this.pen.GetValidEdgePos(this.side, this.sideIndex, targetPos.y);
                closestGridPos = Math.round(targetPos.y / ts);
                flooredGridPos = Math.floor(targetPos.y / ts);
                break;
            case GlassLab.Edge.SIDES.left:
                targetPos.x = Math.min( cursorDifference.x, (this.pen.widths[0] - 1) * ts);
                targetPos.x = this.pen.GetValidEdgePos(this.side, this.sideIndex, targetPos.x);
                closestGridPos = Math.round(targetPos.x / ts);
                flooredGridPos = Math.ceil(targetPos.x / ts);
                break;
            case GlassLab.Edge.SIDES.center:
                targetPos.x = Math.max( cursorDifference.x, -(this.pen.widths[0] - 1) * ts);
                targetPos.x = Math.min( targetPos.x, (this.pen.widths[1] - 1) * ts);
                targetPos.x = this.pen.GetValidEdgePos(this.side, this.sideIndex, targetPos.x);
                closestGridPos = Math.round(targetPos.x / ts);
                flooredGridPos = Math.ceil(targetPos.x / ts);
                break;
            case GlassLab.Edge.SIDES.right:
                targetPos.x = Math.max( cursorDifference.x, -(this.pen.widths[this.sideIndex + 1] - 1) * ts);
                if (this.pen.widths.length > this.sideIndex + 2) {
                    targetPos.x = Math.min( targetPos.x, (this.pen.widths[this.sideIndex + 2] - 1) * ts);
                }
                // Only apply the pen bound limitations to the rightmost edge
                if (this.sideIndex + 2 >= this.pen.widths.length) targetPos.x = this.pen.GetValidEdgePos(this.side, this.sideIndex, targetPos.x);
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

        for (var i = 0; i < this.layers.length; i++) {
            this.layers[i].isoPosition.setTo(this.sprite.isoX, this.sprite.isoY);
        }

        if ((!this.prevClosestGridPos && this.prevClosestGridPos !== 0) || this.prevClosestGridPos != closestGridPos) {
            if (this.horizontal) {
                this.pen.SetTemporarySizeFromEdge(this, 0, closestGridPos * ts, 0, Math.sign(closestGridPos * ts - this.sprite.isoY));
            } else {
                this.pen.SetTemporarySizeFromEdge(this, closestGridPos * ts, 0, Math.sign(closestGridPos * ts - this.sprite.isoX), 0);
            }
            GlassLab.SignalManager.penEdgeDragged.dispatch(this.pen, this);

            this.prevClosestGridPos = closestGridPos;
        }

        // TODO: it would be nice to redraw the contents before the edge is dropped, but it's causing issues
    }
};
