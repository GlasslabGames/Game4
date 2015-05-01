/**
 * Created by Rose Abernathy on 1/14/2015.
 */

var GlassLab = GlassLab || {};
var GLOBAL = GLOBAL || {};

/**
 * Pen
 */
GlassLab.Pen = function(game, layer, height, widths)
{
    this.game = game;
    this.layer = layer;
    this.sprite = this.game.make.isoSprite();
    this.sprite.isoY = -Math.floor(height / 2.0) * GLOBAL.tileManager.tileSize; // TODO: HACK FOR CENTER PLACEMENT
    layer.add(this.sprite).name = "pen";
    this.tiles = [];
    this.unusedTiles = [];

    this.widths = widths || [];
    while (this.widths.length < 2) this.widths.push(1);
    this.height = height || 1;

    this.topEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.top);
    this.bottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
    this.leftEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.left);
    this.centerEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.center);
    this.rightmostEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);
    this.rightEdges = []; // all the other edges (in case we have a pen with more than 2 sections)

    this.edges = [ this.topEdge, this.bottomEdge, this.leftEdge, this.centerEdge ];

    // Now start adding all the edges and other pieces in a certain order. Don't change the order or things will layer incorrectly.

    // Add a root for all tiles now so that tiles will appear under the edges
    this.tileRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.tileRoot).name = "tileRoot";

    this.sprite.addChild(this.leftEdge.sprite);

    this.sprite.addChild(this.centerEdge.sprite);

    // Add a root for all objects that should be behind most of the edges
    this.backObjectRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.backObjectRoot).name = "backObjectRoot";

    this.sprite.addChild(this.topEdge.sprite);

    this.frontObjectRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.frontObjectRoot).name = "frontObjectRoot";

    // Add as many middle edges as we need
    for (var i = 0; i < this.widths.length-2; i++) {
        var edge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, i);
        this.rightEdges.push(edge);
        this.edges.push(edge);
        this.sprite.addChild(edge.sprite);
    }

    this.rightmostEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, this.widths.length-2);
    this.edges.push(this.rightmostEdge);
    this.sprite.addChild(this.rightmostEdge.sprite);

    this.sprite.addChild(this.bottomEdge.sprite);

    this.sprite.events.onDestroy.add(this._onDestroy, this);
};

GlassLab.Pen.prototype._onDestroy = function() {
    GLOBAL.tileManager.clearPenTiles();
};

GlassLab.Pen.prototype.getDimensionEncoding = function() {
    return GlassLab.Pen.encodeDimensions(this.height || 0, this.widths[0] || 0, this.widths[1] || 0, this.widths[2] || 0);
};

GlassLab.Pen.encodeDimensions = function(height, width0, width1, width2) {

    return (height * width0) + "_" + (height * width1) + "_" + (height * width2);
};

GlassLab.Pen.prototype.getFullWidth = function() {
    var width = 0;
    for (var i = 0, len = this.widths.length; i < len; i++) {
        width += this.widths[i];
    }
    return width;
};

// sets only the listed edge(s) to be draggable
GlassLab.Pen.prototype.SetDraggableOnly = function() {
    // first make all edges undraggable, then make the specific ones listed draggable
    for (var i = 0; i < this.edges.length; i++) {
        this.edges[i].setDraggable(false);
    }
    this.SetDraggable.apply(this, arguments);
};

GlassLab.Pen.prototype.SetDraggable = function() {
    // set the listed edges to be draggable
    for (var j=0; j < arguments.length; j++) {
        for (var i = 0; i < this.edges.length; i++) {
            if (this.edges[i] == arguments[j] || this.edges[i].side == arguments[j]) {
                this.edges[i].setDraggable(true);
            }
        }
    }

    this._placeArrows(); // update which arrows are visible
};


GlassLab.Pen.prototype.SetSizeFromEdge = function(edge) {
    var prevDimensions = this.getDimensionEncoding();
    if (!this.prevIsoPos) this.prevIsoPos = new Phaser.Point();
    this.sprite.isoPosition.copyTo(this.prevIsoPos);

    var rows = Math.round(edge.sprite.isoY / GLOBAL.tileSize);
    var cols = Math.round(edge.sprite.isoX / GLOBAL.tileSize);

    switch (edge.side) {
        case GlassLab.Edge.SIDES.top:
            this.height -= rows;
            this.sprite.isoY += rows * GLOBAL.tileSize;
            break;
        case GlassLab.Edge.SIDES.bottom:
            this.height += rows;
            break;
        case GlassLab.Edge.SIDES.left:
            this.widths[0] -= cols;
            this.sprite.isoX += cols * GLOBAL.tileSize;
            break;
        case GlassLab.Edge.SIDES.center:
            this.widths[0] += cols;
            this.widths[1] -= cols;
            break;
        case GlassLab.Edge.SIDES.right:
            this.widths[edge.sideIndex + 1] += cols;
            if (this.widths.length > edge.sideIndex + 2) this.widths[edge.sideIndex + 2] -= cols;
            break;
    }

    this.Resize();

    GLOBAL.audioManager.playSound("clickSound"); // generic interaction sound

    GlassLab.SignalManager.penResized.dispatch(this, prevDimensions, this.getDimensionEncoding());

    GlassLabSDK.saveTelemEvent("resize_pen", {
        rows: this.height,
        creature_columns: this.widths[0],
        foodA_columns: this.widths[1],
        foodB_columns: this.widths[2] || 0,
        pen_dimensions: this.getDimensionEncoding(),
        previous_pen_dimensions: prevDimensions,
        pen_id: this.id,
        side_moved: edge.side + (edge.side == GlassLab.Edge.SIDES.right? edge.sideIndex : "")
    });
};

GlassLab.Pen.prototype.SetTemporarySizeFromEdge = function(edge, edgeX, edgeY, xDir, yDir) {
    this.currentWidths = [].concat(this.widths);
    this.currentHeight = this.height;

    // It's not great to duplicate this functionality from SetSizeFromEdge, but it works for now
    var rows = Math.round(edgeY / GLOBAL.tileSize);
    var cols = Math.round(edgeX / GLOBAL.tileSize);

    switch (edge.side) {
        case GlassLab.Edge.SIDES.top:
            this.currentHeight -= rows;
            //this.sprite.isoY += rows * GLOBAL.tileSize;
            break;
        case GlassLab.Edge.SIDES.bottom:
            this.currentHeight += rows;
            break;
        case GlassLab.Edge.SIDES.left:
            this.currentWidths[0] -= cols;
            //this.sprite.isoX += cols * GLOBAL.tileSize;
            break;
        case GlassLab.Edge.SIDES.center:
            this.currentWidths[0] += cols;
            this.currentWidths[1] -= cols;
            break;
        case GlassLab.Edge.SIDES.right:
            this.currentWidths[edge.sideIndex + 1] += cols;
            if (this.currentWidths.length > edge.sideIndex + 2) this.currentWidths[edge.sideIndex + 2] -= cols;
            break;
    }
};

GlassLab.Pen.prototype.Resize = function() {
    // Lay out tiles to fill in all the rows and columns in the pen based on our current height and widths
    this._resetEdges();
    this._resetTiles();
    var fullWidth = this.getFullWidth();

    // make sure we have the right number of right edges
    while (this.rightEdges.length < this.widths.length - 2) {
        this.addRightEdge();
    }
    for (var i = 0, len = this.rightEdges.length; i < len; i++) {
        if (i < this.widths.length-2) {
            this.rightEdges[i].sideIndex = i;
            this.rightEdges[i].sprite.visible = true;
        } else {
            this.rightEdges[i].sprite.visible = false;
        }
    };

    this._drawEdges();
    this._drawBg();

    // Make sure that the currentWidth and height (displayed in the UIRatioTooltip) are up-to-date
    this.currentWidths = [].concat(this.widths);
    this.currentHeight = this.height;
};

GlassLab.Pen.prototype._drawEdges = function() {};

GlassLab.Pen.prototype.addRightEdge = function() {
    var edge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, 0);
    edge.setDraggable(this.rightmostEdge.draggable); // same status as the other right edge
    this.rightEdges.push(edge);
    this.edges.push(edge);
    this.sprite.addChildAt(edge.sprite, this.sprite.getChildIndex(this.topEdge.sprite)+1);
};

GlassLab.Pen.prototype._resetEdges = function() {
    for (var i = 0; i < this.edges.length; i++) {
        this.edges[i].Reset();
    }
};

GlassLab.Pen.prototype._resetTiles = function() {
    // if we added any tiles over the background tiles, remove them
    this.unusedTiles = [];
    for (var i = 0; i < this.tiles.length; i++) {
        this.unusedTiles.push(this.tiles[i]);
        this.tiles[i].visible = false;
    }

    // if we swapped any of the background tiles and set that they were in the pen, undo it
    GLOBAL.tileManager.clearPenTiles();
};

GlassLab.Pen.prototype.hide = function() {
    this.sprite.visible = false;
    GLOBAL.tileManager.clearPenTiles();
};

GlassLab.Pen.prototype.show = function() {
    this.sprite.visible = true;
    this.Resize(); // refresh and show bg tiles again
};

// The following functions can be overwritten to show different pens (e.g. the crate for shipping)
GlassLab.Pen.prototype._drawVerticalEdge = function(targetEdge, col, startRow, endRow, spriteName, frameName, anchor, colOffset, rowOffset, flip, layerIndex) {
    if (colOffset) col += colOffset;
    if (rowOffset) {
        startRow += rowOffset;
        endRow += rowOffset;
    }

    for (var row = startRow; row < endRow; row++) {
        targetEdge.PlacePiece(col - 1, row, spriteName, frameName, anchor, flip, layerIndex);
    }
};

GlassLab.Pen.prototype._drawHorizontalEdge = function(targetEdge, startCol, endCol, row, spriteName, frameName, anchor, colOffset, rowOffset, allowWindows, layerIndex) {
    var anchor;

    if (colOffset) {
        startCol += colOffset;
        endCol += colOffset;
    }
    if (rowOffset) row += rowOffset;

    for (var col = startCol; col < endCol; col++) {
        var spriteName2 = spriteName, frameName2 = frameName;
        if (allowWindows && (col % 3 == 0)) { // 3 = the frequency of windows
            if (frameName2) frameName2 = (frameName2.indexOf(".") > -1) ? frameName2.replace(".", "_window.") : frameName2 + "_window";
            else spriteName2 += "_window";
        }
        targetEdge.PlacePiece(col, row, spriteName2, frameName2, anchor, false, layerIndex);
    }
};

GlassLab.Pen.prototype._drawBg = function() {
    for (var col = 0; col < this.getFullWidth(); col++) {
        for (var row = 0; row < this.height; row++) {
            var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
            if (tile) {
                tile.setInPen(this);
                this._drawBgAtTile(col, row, tile);
            }
        }
    }
};

GlassLab.Pen.prototype._drawBgAtTile = function(col, row, tile) {};

GlassLab.Pen.prototype._placeArrows = function() {
    for (var i = 0; i < this.edges.length; i++) {
        var draggable = this.edges[i].draggable;

        if (draggable) { // if there's no space to drag an edge out, don't show the arrow
            var side = this.edges[i].side;
            if (side == GlassLab.Edge.SIDES.center && this.widths[1] <= 1) draggable = false;
            else if (side == GlassLab.Edge.SIDES.right && this.widths[this.edges[i].sideIndex + 2] <= 1) draggable = false;
            else if ((side == GlassLab.Edge.SIDES.top || side == GlassLab.Edge.SIDES.bottom) &&
                this.maxHeight && this.height >= this.maxHeight) draggable = false;
        }
        this.edges[i].showArrow(draggable);
    }

    var space = 0.75;
    var midRow = this.height / 2 - 0.5;
    this.leftEdge.placeArrow(1 - space, midRow);
    var col = this.widths[0] + space;
    this.centerEdge.placeArrow(col, midRow);
    for (var i = 1, len = this.widths.length - 1; i < len; i++) {
        col += this.widths[i];
        this.rightEdges[i - 1].placeArrow( col, midRow );
    }
    this.rightmostEdge.placeArrow(this.getFullWidth() + space, midRow);

    var midCol = this.getFullWidth() / 2 - 0.5;
    this.topEdge.placeArrow( midCol, 1.5 - space);
    this.bottomEdge.placeArrow( midCol, this.height + space );
};

GlassLab.Pen.prototype._placeTile = function(xPos, yPos, parent, atlasName, spriteName, tint, scale, anchor) {

    var tile = this.unusedTiles.pop();
    if (!tile) { // we ran out of existing tiles, so make a new one
        tile = this.game.make.isoSprite(0, 0, 0, atlasName, spriteName);
        this.tiles.push(tile);
    }
    tile.visible = true;
    parent.addChild(tile);
    if (tile.spriteName != spriteName) tile.loadTexture(atlasName, spriteName);
    tile.isoX = xPos;
    tile.isoY = yPos;
    tile.tint = (typeof tint != 'undefined')? tint : 0xffffff;
    if (anchor) tile.anchor.setTo(anchor.x, anchor.y);
    else tile.anchor.setTo(0.075, 0.04);
    tile.scale.setTo(scale || 1, scale || 1);
    tile.parent.setChildIndex(tile, tile.parent.children.length - 1); // move it to the back of the children so far
};

/**
 * Checks whether or not tile is within this pen
 * @param tile
 * @param leftOnly
 * @returns {boolean}
 * @private
 */
GlassLab.Pen.prototype._containsTile = function(tile, leftOnly) {
    var section = this.getSection(tile);
    if (leftOnly) return section == 0;
    else return section > -1;
};

// Returns the index of the section that this tile is in, or -1 if it's not in the pen
GlassLab.Pen.prototype.getSection = function(tile) {
    if (!tile) return -1;
    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
    if (!originTile) return -1;
    if (tile.col < originTile.col || tile.row < originTile.row || tile.row >= originTile.row + this.height) return -1;
    var targetCol = originTile.col;
    for (var i = 0; i < this.widths.length; i++) {
        targetCol += this.widths[i];
        if (tile.col < targetCol) return i;
    }
    return -1; // off the right side
};

// given the place where the user wants to put this edge, return the closest location it could be set to
GlassLab.Pen.prototype.GetValidEdgePos = function(edge, edgeIndex, targetPos) {
    // First, make sure we don't exceed the max height that's possible for this pen
    if (this.maxHeight) {
        if (edge == GlassLab.Edge.SIDES.top) {
            targetPos = Math.max( targetPos, (this.height - this.maxHeight) * GLOBAL.tileSize);
        } else if (edge == GlassLab.Edge.SIDES.bottom) {
            targetPos = Math.min( targetPos, (this.maxHeight - this.height) * GLOBAL.tileSize);
        }
    }

    // Then check that our pen isn't exceeding the size of the pen area (currently the whole world, but it could be changed)

    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
    var topRow = originTile.row, leftCol = originTile.col, bottomRow = originTile.row + this.height, rightCol = originTile.col + this.getFullWidth();

    // note that we could change these later to reflect parts of the world that don't allow the pen.
    var minRow = 0, maxRow = GLOBAL.tileManager.GetMapHeight(), minCol = 0, maxCol = GLOBAL.tileManager.GetMapWidth();

    if (edge == GlassLab.Edge.SIDES.top) {
        targetPos = Math.max( targetPos, (minRow - topRow) * GLOBAL.tileSize);
    } else if (edge == GlassLab.Edge.SIDES.bottom) {
        targetPos = Math.min( targetPos, (maxRow - bottomRow) * GLOBAL.tileSize);
    } else if (edge == GlassLab.Edge.SIDES.left) {
        targetPos = Math.max( targetPos, (minCol - leftCol) * GLOBAL.tileSize);
    } else if (edge == GlassLab.Edge.SIDES.right) {
        targetPos = Math.min( targetPos, (maxCol - rightCol) * GLOBAL.tileSize);
    }

    return targetPos;
};

GlassLab.Pen.prototype.FillIn = function(boundConstructor, parent, list, maxCount, startCol, endCol, fromRight, targetType, animate, alpha) {
    var unusedObjects = Array.prototype.concat.apply([], list); // flatten the 2D list into a new array
    var count = 0;
    list.length = 0; // empty the list. Setting it to [] would break the passed-in reference.

    for (var row = 0; row < this.height; row++) {
        if ((maxCount || maxCount === 0) && count >= maxCount) break;
        list.push([]);
        var emptyCols = 0;
        if (fromRight) emptyCols = Math.max(0, (endCol - startCol) - (maxCount - count)); // the empty spots that would be in the middle if we don't adjust positions

        for (var col = startCol; col < endCol; col ++) {
            if ((maxCount || maxCount === 0) && count >= maxCount) break;
            var obj  = unusedObjects.pop();
            if (obj && !obj.parent)
            {
                console.error("Object doesn't have parent set! Was it destroyed? Not reusing");
                obj = null;
            }
            if (!obj) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                if (parent.addChild) parent.addChild(obj); // if the parent is a sprite
                else parent.add(obj); // if the parent is a group
                if (obj.draggableComponent) obj.draggableComponent.active = false; // prevent dragging it out of the pen
            }
            obj.visible = true;
            obj.alpha = (typeof alpha != 'undefined')? alpha : 1;
            obj.pen = this;
            obj.inputEnabled = false;

            if (targetType && obj.setType) obj.setType(targetType, animate);
            if (obj.placeOnTile) obj.placeOnTile(col + emptyCols, row);
            else {
                obj.isoX = (col + emptyCols) * GLOBAL.tileSize;
                obj.isoY = row * GLOBAL.tileSize;
            }

            obj.parent.setChildIndex(obj, obj.parent.children.length - 1); // move it to the back of the children so far
            list[row].push(obj);
            count++;
        }
    }

    for (var i = unusedObjects.length-1; i >= 0; i--) {
        if (unusedObjects[i]) unusedObjects[i].visible = false;
    }
};