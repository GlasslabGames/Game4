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

    // Add a root for all tiles now so that tiles will appear under the edges
    this.tileRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.tileRoot).name = "tileRoot";

    this.cornerSprite = this.game.make.isoSprite();
    this.sprite.addChild(this.cornerSprite).name = "cornerSprite";

    this.sprite.addChild(this.leftEdge.sprite);

    // Add a root for all objects that will be added
    this.objectRoot = this.game.make.isoSprite();
    this.sprite.addChild(this.objectRoot).name = "objectRoot";

    this.sprite.addChild(this.centerEdge.sprite);

    for (var i = 0; i < this.widths.length-1; i++) {
        var edge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, i);
        this.rightEdges.push(edge);
        this.edges.push(edge);
        this.sprite.addChild(edge.sprite);
    }

    this.sprite.addChild(this.topEdge.sprite); // note, the order of all this might have to change
    this.sprite.addChild(this.bottomEdge.sprite);

    var style = { font: "65px Arial Black", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 8 };
    this.ratioLabel = game.make.text(0, 0, "1 : 2", style);
    this.ratioLabel.anchor.set(0.5, 1);
    this.sprite.addChild(this.ratioLabel);
    this.ratioLabel.x = this.topEdge.sprite.x;
    this.ratioLabel.y = this.topEdge.sprite.y - GLOBAL.tileSize * 1.5;

    this.penStyle = GlassLab.Pen.STYLES.gate; // change this to toggle the pen's appearance

    this.Resize();
};

GlassLab.Pen.STYLES = {crate: "crate", gate: "gate"};

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
    console.log("Setting previous position to",this.prevIsoPos);

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
        if (this.cornerSprite.spriteName != "crateBackCorner") this.cornerSprite.loadTexture("crateBackCorner");
        this.cornerSprite.anchor.setTo(0.075, 0.04);
        this.cornerSprite.isoPosition.setTo(GLOBAL.tileSize * -2, GLOBAL.tileSize * -1);
    } else {
        this.cornerSprite.visible = false;
    }

    // if this has a gate that can go up and down, we need to add/show various other pieces
    if (this.penStyle == GlassLab.Pen.STYLES.gate) {
        if (!this.gateBack) {
            var anchorX = 0.15, anchorY = 0.28; // should match the anchor given for the gate in "drawVerticalEdge"
            this.gateBack = this.game.make.isoSprite(0, 0, 0, "gateCapFar");
            this.gateBack.anchor.setTo(anchorX, anchorY);
            this.centerEdge.sprite.addChildAt(this.gateBack, 0);
            this.gateFront = this.game.make.isoSprite();
            this.centerEdge.sprite.addChild(this.gateFront, 0);

            this.gateLever = this.game.make.sprite(0, 0, "gateSwitchFail");
            this.gateLight = this.game.make.sprite(0, 0, "gateLightRed");
            this.gateFront.addChild(this.gateLever).anchor.setTo(anchorX, anchorY);
            this.gateFront.addChild(this.gateLight).anchor.setTo(anchorX, anchorY);
            this.gateFront.addChild(this.game.make.sprite(0, 0, "gateCapNear")).anchor.setTo(anchorX, anchorY);
            this.gateFront.addChild(this.game.make.sprite(0, 0, "gateSwitchBack")).anchor.setTo(anchorX, anchorY);
        }

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
    for (var i = 1, len = this.widths.length; i < len; i++) {
        col += this.widths[i];
        if (this.rightEdges[i-1].sprite.visible) this._drawVerticalEdge(this.rightEdges[i-1], col, 0, this.height);
    }

    if (this.penStyle == GlassLab.Pen.STYLES.gate) {
        //FIXME this._drawHorizontalEdge(this.topEdge, 0, this.widths[0], 0, "dottedLineLeft");
        this._drawHorizontalEdge(this.topEdge, this.widths[0], fullWidth, 0, "penFenceRight");
        //this._drawHorizontalEdge(this.bottomEdge, 0, this.widths[0], this.height, "dottedLineLeft");
        this._drawHorizontalEdge(this.bottomEdge, this.widths[0], fullWidth, this.height, "penFenceRight");
    } else {
        this._drawHorizontalEdge(this.topEdge, (this.cornerSprite.visible? 1 : 0), fullWidth, 0);
        this._drawHorizontalEdge(this.bottomEdge, 0, fullWidth, this.height);
    }

    this._placeArrows();

    this.ratioLabel.text = this.widths[0] * this.height;
    for (var i = 1, len = this.widths.length; i < len; i++) {
        this.ratioLabel.text += " : " + (this.widths[i] * this.height);
    }
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

// The following functions can be overwritten to show different pens (e.g. the crate for shipping)
GlassLab.Pen.prototype._drawVerticalEdge = function(targetEdge, col, startRow, endRow) {
    var spriteName, anchor;
    if (this.penStyle == GlassLab.Pen.STYLES.crate) {
        if (targetEdge.side == GlassLab.Edge.SIDES.left) {
            spriteName = "crateBackLeft";
        } else {
            spriteName = "crateFrontRight";
            col --;
        }
        startRow --;
        endRow --;
        anchor = new Phaser.Point(0.075, 0.04);
    } else {
        if (targetEdge.side == GlassLab.Edge.SIDES.left ||
            (targetEdge.side == GlassLab.Edge.SIDES.right && targetEdge.sideIndex < this.widths.length - 2)) {
            spriteName = "dottedLineRight";
            anchor = new Phaser.Point(0.1, 0.15);
        } else if (targetEdge.side == GlassLab.Edge.SIDES.center) {
            spriteName = "gateDown";
            anchor = new Phaser.Point(0.15, 0.28);
        } else {
            spriteName = "penFenceLeft";
            anchor = new Phaser.Point(0.1, 0.15);
        }
    }

    for (var row = startRow; row < endRow; row++) {
        targetEdge.PlacePiece(col - 2, row, spriteName, anchor);
    }
};

GlassLab.Pen.prototype._drawHorizontalEdge = function(targetEdge, startCol, endCol, row, spriteName) {
    var anchor;
    if (this.penStyle == GlassLab.Pen.STYLES.crate) {
        if (targetEdge.side == GlassLab.Edge.SIDES.bottom) {
            spriteName = "crateFrontLeft";
            row --;
        }
        var windowFreq = 3; // the frequency of windows. Only used for the top side
        startCol --;
        endCol --;
        anchor = new Phaser.Point(0.075, 0.04);
    } else {
        // spriteName = "penFenceRight"; // just use the passed-in spritename
        anchor = new Phaser.Point(0.1, 0.15);
    }

    for (var col = startCol; col < endCol; col++) {
        if (this.penStyle == GlassLab.Pen.STYLES.crate && targetEdge.side == GlassLab.Edge.SIDES.top) {
            spriteName = ((col - startCol) % windowFreq == 0)? "crateBackRightWindow" : "crateBackRight";
        }
        targetEdge.PlacePiece(col - 1, row - 1, spriteName, anchor);
    }
};

GlassLab.Pen.prototype._drawBg = function() {
    for (var col = 0; col < this.getFullWidth(); col++) {
        for (var row = 0; row < this.height; row++) {
            var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
            if (tile) {
                tile.setInPen(this);
                if (this.penStyle == GlassLab.Pen.STYLES.crate) {
                    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), "crateFloor");
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

GlassLab.Pen.prototype._placeTile = function(xPos, yPos, spriteName) {

    var tile = this.unusedTiles.pop();
    if (!tile) { // we ran out of existing tiles, so make a new one
        tile = this.game.make.isoSprite(0, 0, 0, spriteName);
        tile.anchor.setTo(0.075, 0.04);
        this.tileRoot.addChild(tile);
        this.tiles.push(tile);
    }
    tile.visible = true;
    if (tile.spriteName != spriteName) tile.loadTexture(spriteName);
    tile.isoX = xPos;
    tile.isoY = yPos;
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
    if (tile.col < originTile.col || tile.row < originTile.row || tile.row > originTile.row + this.height)
    {
        return false;
    }

    var rightSide = originTile.col + (leftOnly? this.widths[0] : this.getFullWidth());
    return tile.col < rightSide;
    // This functionality could be replaced with _getSection
};

// Returns the index of the section that this tile is in, or -1 if it's not in the tile
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