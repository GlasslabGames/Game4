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
    this.rightEdges = []; // all the other edges (in case we have a pen with more than 2 sections)

    this.edges = [ this.topEdge, this.bottomEdge, this.leftEdge, this.centerEdge ];

    // Now start adding all the edges and other pieces in a certain order. Don't change the order or things will layer incorrectly.

    // The shadow is only used for the crate atm
    this.shadow = this.game.make.isoSprite(GLOBAL.tileSize + 20, GLOBAL.tileSize);
    this.sprite.addChild(this.shadow);
    this.shadow.alpha = 0.4;

    // Add a root for all tiles now so that tiles will appear under the edges
    this.tileRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.tileRoot).name = "tileRoot";

    this.cornerSprite = this.game.make.isoSprite();
    this.sprite.addChild(this.cornerSprite).name = "cornerSprite";

    this.sprite.addChild(this.leftEdge.sprite);

    // Add a root for all objects that will be added
    this.backObjectRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.backObjectRoot).name = "backObjectRoot";

    this.sprite.addChild(this.centerEdge.sprite);

    this.sprite.addChild(this.topEdge.sprite);

    var rightmostEdge;
    for (var i = 0; i < this.widths.length-1; i++) {
        var edge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, i);
        this.rightEdges.push(edge);
        this.edges.push(edge);
        if (i == this.widths.length - 2) {
            rightmostEdge = edge; // remember this edge and we'll add it later in the heirarchy
        } else {
            this.sprite.addChild(edge.sprite);
        }
    }

    this.gateFront = this.game.make.isoSprite();
    this.sprite.addChild(this.gateFront).name = "gateFront";

    this.frontObjectRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.frontObjectRoot).name = "frontObjectRoot";

    if (rightmostEdge) this.sprite.addChild(rightmostEdge.sprite);

    this.sprite.addChild(this.bottomEdge.sprite);

    this.penStyle = GlassLab.Pen.STYLES.gate; // change this to toggle the pen's appearance

    this.sprite.events.onDestroy.add(this._onDestroy, this);

    this.Resize();
};

GlassLab.Pen.STYLES = {crate: "crate", gate: "gate"};

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
        this.edges[i].draggable = false;
    }
    this.SetDraggable.apply(this, arguments);
};

GlassLab.Pen.prototype.SetDraggable = function() {
    // set the listed edges to be draggable
    for (var j=0; j < arguments.length; j++) {
        for (var i = 0; i < this.edges.length; i++) {
            if (this.edges[i] == arguments[j] || this.edges[i].side == arguments[j]) {
                this.edges[i].draggable = true;
                //break; // Don't break because there might now be multiple edges with the same side (CENTER)
            }
        }
    }

    this._placeArrows(); // update which arrows are visible
};


GlassLab.Pen.prototype.SetSizeFromEdge = function(edge, edgeIndex) {
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

GlassLab.Pen.prototype.Resize = function() {
    // Lay out tiles to fill in all the rows and columns in the pen based on our current height and widths
    this._resetEdges();
    this._resetTiles();
    var fullWidth = this.getFullWidth();

    // if we look like a crate, we need to show a special corner sprite
    if (this.penStyle == GlassLab.Pen.STYLES.crate) {
        this.cornerSprite.visible = true;
        if (this.cornerSprite.spriteName != "crate" || this.cornerSprite.frameName != "crate_back_corner.png") this.cornerSprite.loadTexture("crate", "crate_back_corner.png"); // TODO: FIX IF CHECK
        this.cornerSprite.anchor.setTo(0.075, 0.04);
        this.cornerSprite.isoPosition.setTo(GLOBAL.tileSize * -2, GLOBAL.tileSize * -1);
    } else {
        this.cornerSprite.visible = false;
    }

    // if this has a gate that can go up and down, we need to add/show various other pieces
    if (this.penStyle == GlassLab.Pen.STYLES.gate) {
        if (!this.gateBack) this._makeGatePieces();

        this.gateBack.visible = true;
        this.gateFront.visible = true;

        this.gateBack.isoPosition.setTo(GLOBAL.tileSize * (this.widths[0] - 2), 0);
        this.gateFront.isoPosition.setTo(GLOBAL.tileSize * (this.widths[0] - 2), GLOBAL.tileSize * (this.height - 1));

    } else {
        if (this.gateBack) this.gateBack.visible = false;
        if (this.gateFront) this.gateFront.visible = false;
    }

    this._drawBg();

    var col = 0;
    this._drawVerticalEdge(this.leftEdge, col, (this.cornerSprite.visible? 1 : 0), this.height);
    col += this.widths[0]; // offset by 1 since the bottom edge is anchored so that it appears at the bottom of a tile
    this._drawVerticalEdge(this.centerEdge, col, 0, this.height);

    // make sure we have the right number of edges
    while (this.rightEdges.length < this.widths.length) {
        this.addRightEdge();
    }
    for (var i = 0, len = this.rightEdges.length; i < len; i++) {
        if (i < this.widths.length-1) {
            col += this.widths[i+1];
            this.rightEdges[i].sprite.visible = true;
            this.rightEdges[i].sideIndex = i;
            this._drawVerticalEdge(this.rightEdges[i], col, 0, this.height);
        } else {
            this.rightEdges[i].sprite.visible = false;
        }
    };

    if (this.penStyle == GlassLab.Pen.STYLES.gate) {
        // this._drawHorizontalEdge(this.topEdge, 0, this.widths[0] - 1, 0, "dottedLineLeft"); // right now this doesn't work... this part needs to be behind the creatures but the fence needs to be in front
        this._drawHorizontalEdge(this.topEdge, this.widths[0], fullWidth, 0, "penFenceRight");
        //this._drawHorizontalEdge(this.bottomEdge, 0, this.widths[0] - 1, this.height, "dottedLineLeft"); // width - 1 so it doesn't interfere with the gate :?
        this._drawHorizontalEdge(this.bottomEdge, this.widths[0], fullWidth, this.height, "penFenceRight");
    } else {
        this._drawHorizontalEdge(this.topEdge, (this.cornerSprite.visible? 1 : 0), fullWidth, 0, null, null, true);
        this._drawHorizontalEdge(this.bottomEdge, 0, fullWidth, this.height);
    }

    this._placeArrows();
};

GlassLab.Pen.prototype.addRightEdge = function() {
    var edge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, 0);
    this.rightEdges.unshift(edge);
    this.edges.unshift(edge);
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
GlassLab.Pen.prototype._drawVerticalEdge = function(targetEdge, col, startRow, endRow, atlasName, spriteName) {
    var spriteName, anchor, atlasName;
    if (this.penStyle == GlassLab.Pen.STYLES.crate) {
        if (!atlasName && !spriteName) atlasName = "crate";
        if (targetEdge.side == GlassLab.Edge.SIDES.left) {
            if (!spriteName) spriteName = "crate_back_left.png";
        } else {
            if (!spriteName) spriteName = "crate_front_right.png";
            col --;
        }
        startRow --;
        endRow --;
        anchor = new Phaser.Point(0.075, 0.04);
    } else {
        if (targetEdge.side == GlassLab.Edge.SIDES.left ||
            (targetEdge.side == GlassLab.Edge.SIDES.right && targetEdge.sideIndex < this.widths.length - 2)) {
            if (!spriteName) spriteName = "dottedLineRight";
            anchor = new Phaser.Point(0.1, 0.15);
        } else if (targetEdge.side == GlassLab.Edge.SIDES.center) {
            if (!spriteName) spriteName = "gateDown";
            anchor = new Phaser.Point(0.15, 0.28);
        } else {
            if (!spriteName) spriteName = "penFenceLeft";
            anchor = new Phaser.Point(0.1, 0.15);
        }
    }

    for (var row = startRow; row < endRow; row++) {
        if (!atlasName) targetEdge.PlacePiece(col - 2, row, spriteName, "", anchor);
        else  targetEdge.PlacePiece(col - 2, row, atlasName, spriteName, anchor);
    }
};

GlassLab.Pen.prototype._drawHorizontalEdge = function(targetEdge, startCol, endCol, row, atlasName, spriteName, allowWindows) {
    var anchor;
    if (this.penStyle == GlassLab.Pen.STYLES.crate) {
        if (!atlasName && !spriteName) atlasName = "crate"; // set this default only if we haven't passed in another spriteName
        if (targetEdge.side == GlassLab.Edge.SIDES.bottom) {
            if (!spriteName) spriteName = "crate_front_left.png";
            row --;
        } else if (targetEdge.side == GlassLab.Edge.SIDES.top) {
            if (!spriteName) spriteName = "crate_back_right.png";
        }
        startCol --;
        endCol --;
        anchor = new Phaser.Point(0.075, 0.04);
    } else {
        // spriteName = "penFenceRight"; // just use the passed-in spritename
        anchor = new Phaser.Point(0.1, 0.15);
    }

    // This is so messy. TODO: instead of "allowWindows", just pass in the alternate spriteName (and pass in the anchor too)
    for (var col = startCol; col < endCol; col++) {
        var atlasName2 = atlasName, spriteName2 = spriteName;
        var windowFreq = 3; // the frequency of windows.
        if (this.penStyle == GlassLab.Pen.STYLES.crate && allowWindows && (col % windowFreq == 0)) {
            spriteName2 = (spriteName2.indexOf(".png") > -1) ? spriteName2.replace(".png", "_window.png") : spriteName2 + "_window";
        }
        if (!atlasName2) {
            atlasName2 = spriteName2;
            spriteName2 = "";
        }
        targetEdge.PlacePiece(col - 1, row - 1, atlasName2, spriteName2, anchor);
    }
};

GlassLab.Pen.prototype._drawBg = function() {
    for (var col = 0; col < this.getFullWidth(); col++) {
        for (var row = 0; row < this.height; row++) {
            var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
            if (tile) {
                tile.setInPen(this);
                if (this.penStyle == GlassLab.Pen.STYLES.crate) {
                    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.tileRoot, "crate", "crate_floor.png");
                    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.shadow, "crate_shadow", "", 0x000000);
                }
                else if (col >= this.widths[0]) tile.swapType(GlassLab.Tile.TYPES.dirt);
            }
        }
    }
};

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

    var midCol = this.getFullWidth() / 2 - 1.25;
    var midRow = this.height / 2 - 1.25;
    this.leftEdge.placeArrow(0, midRow);
    this.centerEdge.placeArrow(this.widths[0], midRow);
    var col = this.widths[0];
    for (var i = 1, len = this.widths.length; i < len; i++) {
        col += this.widths[i];
        this.rightEdges[i - 1].placeArrow( col, midRow );
    }
    this.topEdge.placeArrow( midCol, 0);
    this.bottomEdge.placeArrow( midCol, this.height );
};

GlassLab.Pen.prototype._placeTile = function(xPos, yPos, parent, atlasName, spriteName, tint) {

    var tile = this.unusedTiles.pop();
    if (!tile) { // we ran out of existing tiles, so make a new one
        tile = this.game.make.isoSprite(0, 0, 0, atlasName, spriteName);
        tile.anchor.setTo(0.075, 0.04);
        this.tiles.push(tile);
    }
    tile.visible = true;
    parent.addChild(tile);
    if (tile.spriteName != spriteName) tile.loadTexture(atlasName, spriteName);
    tile.isoX = xPos;
    tile.isoY = yPos;
    tile.tint = (typeof tint != 'undefined')? tint : 0xffffff;
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
    // If no tile, return false
    if (!tile)
    {
        return false;
    }

    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);

    // All cases outside
    if (!originTile || tile.col < originTile.col || tile.row < originTile.row || tile.row > originTile.row + this.height)
    {
        return false;
    }

    var rightSide = originTile.col + (leftOnly? this.widths[0] : this.getFullWidth());
    return tile.col < rightSide;
    // This functionality could be replaced with _getSection
};

// Returns the index of the section that this tile is in, or -1 if it's not in the pen
GlassLab.Pen.prototype._getSection = function(tile) {
    if (!tile) return -1;
    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
    if (tile.col < originTile.col || tile.row < originTile.row || tile.row >= originTile.row + this.height) return -1;
    var targetCol = originTile.col;
    for (var i = 0; i < this.widths.length; i++) {
        targetCol += this.widths[i];
        if (tile.col < targetCol) return i;
    }
    return -1; // off the right side
};

GlassLab.Pen.prototype._makeGatePieces = function() {
    var anchorX = 0.15, anchorY = 0.28; // should match the anchor given for the gate in "drawVerticalEdge"
    this.gateBack = this.game.make.isoSprite(0, 0, 0, "gateCapFar");
    this.gateBack.anchor.setTo(anchorX, anchorY);
    this.centerEdge.sprite.addChildAt(this.gateBack, 0);

    this.gateFront.addChild(this.game.make.sprite(0, 0, "gateCapNear")).anchor.setTo(anchorX, anchorY);

    this.gateHoverEffect = this.game.make.sprite(0,0, "gateHover");
    this.gateFront.addChild(this.gateHoverEffect).anchor.setTo(anchorX, anchorY);
    this.gateHoverEffect.alpha = 0;

    this.gateFront.addChild(this.game.make.sprite(0, 0, "gateSwitchBack")).anchor.setTo(anchorX, anchorY);

    this.gateLever = this.game.make.sprite(0, 0, "gateSwitchFail");
    this.gateLever.inputEnabled = true;
    this.gateLever.events.onInputDown.add(this._onLeverPulled, this);
    this.gateLever.events.onInputOver.add(this._onOverLever, this);
    this.gateLever.events.onInputOut.add(this._onOffLever, this);
    this.gateLever.input.priorityID = 10; // above other game objects, though below the UI
    /*var graphics = this.game.make.graphics();
    graphics.beginFill(0x0000ff, 0.5).drawCircle(45, 75, 140);
    this.gateLever.addChild(graphics);*/
    this.gateLever.hitArea = new Phaser.Circle(45, 75, 140);
    this.gateFront.addChild(this.gateLever).anchor.setTo(anchorX, anchorY);

    this.gateLight = this.game.make.sprite(0, 0, "gateLightRed");
    this.gateFront.addChild(this.gateLight).anchor.setTo(anchorX, anchorY);
};

GlassLab.Pen.prototype._onOverLever = function() {
    this.game.add.tween(this.gateHoverEffect).to({alpha: 0.5}, 150, Phaser.Easing.Linear.InOut, true);
};


GlassLab.Pen.prototype._onOffLever = function() {
    this.game.add.tween(this.gateHoverEffect).to({alpha: 0}, 150, Phaser.Easing.Linear.InOut, true);
};

// this is overwritten in Feeding Pen
GlassLab.Pen.prototype._onLeverPulled = function() {};

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

GlassLab.Pen.prototype.FillIn = function(boundConstructor, parent, list, maxCount, startCol, endCol, fromRight, targetType) {
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
            if (!obj) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                if (parent.addChild) parent.addChild(obj); // if the parent is a sprite
                else parent.add(obj); // if the parent is a group
                if (obj.draggableComponent) obj.draggableComponent.active = false; // prevent dragging it out of the pen
            }
            obj.setType(targetType);
            obj.visible = true;
            obj.placeOnTile(col + emptyCols, row);
            obj.parent.setChildIndex(obj, obj.parent.children.length - 1); // move it to the back of the children so far
            obj.pen = this;
            list[row].push(obj);
            count++;
        }
    }

    for (var i = unusedObjects.length-1; i >= 0; i--) {
        if (unusedObjects[i]) unusedObjects[i].visible = false;
        else unusedObjects.splice(i, 1);
    }
};