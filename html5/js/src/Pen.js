/**
 * Created by Rose Abernathy on 1/14/2015.
 */

var GlassLab = GlassLab || {};
var GLOBAL = GLOBAL || {};

/**
 * Pen
 */
GlassLab.Pen = function(game, layer, leftWidth, rightWidth, height )
{
  this.game = game;
  this.layer = layer;
  this.sprite = this.game.make.isoSprite();
  layer.add(this.sprite).name = "pen";
  this.tiles = [];
  this.unusedTiles = [];

  this.leftWidth = leftWidth || 1;
  this.rightWidth = rightWidth || 1;
  this.height = height || 1;

  this.topEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.top);
  this.bottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
  this.centerEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.center);
  this.leftEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.left);
  this.rightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);

  this.edges = [ this.topEdge, this.bottomEdge, this.centerEdge, this.leftEdge, this.rightEdge ];

  this.sprite.addChild(this.topEdge.sprite);
  this.sprite.addChild(this.leftEdge.sprite);

  // Add a root for all tiles now so that tiles will appear under the edges
  this.tileRoot = this.game.make.isoSprite();
  this.sprite.addChild(this.tileRoot).name = "tileRoot";

  // Add a root for all objects that will be added
  this.objectRoot = this.game.make.isoSprite();
  this.sprite.addChild(this.objectRoot).name = "objectRoot";

  this.sprite.addChild(this.centerEdge.sprite);
  this.sprite.addChild(this.bottomEdge.sprite);
  this.sprite.addChild(this.rightEdge.sprite);

  var style = { font: "65px Arial Black", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 8 };
  this.ratioLabel = game.make.text(0, 0, "1 : 2", style);
  this.ratioLabel.anchor.set(0.5, 1);
  this.sprite.addChild(this.ratioLabel);
  this.ratioLabel.x = this.topEdge.sprite.x;
  this.ratioLabel.y = this.topEdge.sprite.y - GLOBAL.tileSize * 1.5;

  this.Resize();
};


GlassLab.Pen.LEFT_COLOR = 0xF0E4E1; //0xA8C2EF;
GlassLab.Pen.RIGHT_COLOR = 0xFFFFFF; //0xF0C5CA;

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
  for(var j=0; j < arguments.length; j++) {
    for (var i = 0; i < this.edges.length; i++) {
      if (this.edges[i] == arguments[j] || this.edges[i].side == arguments[j]) {
        this.edges[i].draggable = true;
        break;
      }
    }
  }
};

GlassLab.Pen.prototype.SetSize = function(leftWidth, rightWidth, height) {
  this.leftWidth = leftWidth;
  this.rightWidth = rightWidth;
  this.height = height;
  this.Resize();
};

GlassLab.Pen.prototype.SetSizeFromEdge = function(edge) {
  var rows = Math.round(edge.sprite.isoY / GLOBAL.tileSize);
  var cols = Math.round(edge.sprite.isoX / GLOBAL.tileSize);
  //console.log("left:",this.leftWidth,"right:",this.rightWidth,"height:",this.height);
  //console.log("cols:", cols, "rows:", rows);
  console.log("setSizeFromEdge");

  switch (edge.side) {
    case GlassLab.Edge.SIDES.top:
      this.height -= rows;
      this.sprite.isoY += rows * GLOBAL.tileSize;
      break;
    case GlassLab.Edge.SIDES.bottom:
      this.height += rows;
      break;
    case GlassLab.Edge.SIDES.left:
      this.leftWidth -= cols;
      this.sprite.isoX += cols * GLOBAL.tileSize;
      break;
    case GlassLab.Edge.SIDES.right:
      this.rightWidth += cols;
      break;
    case GlassLab.Edge.SIDES.center:
      this.leftWidth += cols;
      this.rightWidth -= cols;
      break;
  }
  this.Resize();
};

GlassLab.Pen.prototype.Resize = function() {
  // Lay out tiles to fill in all the rows and columns in the pen based on our current height and widths
  this._resetEdges();
  this._resetTiles();

  for (var row = 0; row < this.height; row++) {
    this._drawRow(row * GLOBAL.tileSize, 0, this.leftWidth, this.leftWidth + this.rightWidth);
  }

  for (var col = 0; col < this.leftWidth + this.rightWidth; col++) {
    this.topEdge.PlacePiece(col, 0);
    this.bottomEdge.PlacePiece(col, this.height);
  }

  this.ratioLabel.text = (this.leftWidth * this.height) + " : " + (this.rightWidth * this.height);
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

GlassLab.Pen.prototype._drawRow = function(yPos, leftCol, centerCol, rightCol) {
  for (var col = leftCol; col < rightCol; col++) {
    // this part swaps whatever tile was there for a dirt tile (but remember what it was to swap it back later)
    var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + yPos);
    if (tile)
    {
      tile.setInPen(this);
      if (col >= centerCol) tile.swapType(GlassLab.Tile.TYPES.dirt);
    }

    // This part draws an overlay tile
    //this._placeTile(col * GLOBAL.tileSize, yPos, (col < centerCol)); // to add an image on the tile
  }

  this.leftEdge.PlacePieceAt( GLOBAL.tileSize * leftCol, yPos );
  this.centerEdge.PlacePieceAt( GLOBAL.tileSize * centerCol, yPos );
  this.rightEdge.PlacePieceAt( GLOBAL.tileSize * rightCol, yPos );
};

GlassLab.Pen.prototype._drawCol = function(xPos, topRow, bottomRow) {
  for (var row = topRow; row < bottomRow; row++) {
    // this part swaps whatever tile was there for a dirt tile (but remember what it was to swap it back later)
    var tile = GLOBAL.tileManager.GetTileAtCoord(this.sprite.isoX + xPos, this.sprite.isoY + (GLOBAL.tileSize * row));
    tile.setInPen(this);
    tile.swapType(GlassLab.Tile.TYPES.dirt);

    // This part draws an overlay tile
    //this._placeTile(xPos, row * GLOBAL.tileSize, (col < this.leftWidth));
  }

  this.topEdge.PlacePieceAt(xPos, topRow * GLOBAL.tileSize);
  this.bottomEdge.PlacePieceAt(xPos, bottomRow * GLOBAL.tileSize);
};

GlassLab.Pen.prototype._placeTile = function(xPos, yPos, onLeft) {
  if (onLeft) return; // for now, don't place any tile on the left side

  var tile = this.unusedTiles.pop();
  if (!tile) { // we ran out of existing tiles, so make a new one
    tile = this.game.make.isoSprite(0, 0, 0, "penBg");
    tile.anchor.set(0.5, 0.5);
    this.tileRoot.addChild(tile);
    this.tiles.push(tile);
  }
  tile.visible = true;
  tile.isoX = xPos;
  tile.isoY = yPos;
  tile.tint = (onLeft) ? GlassLab.Pen.LEFT_COLOR : GlassLab.Pen.RIGHT_COLOR;
  tile.parent.setChildIndex(tile, tile.parent.children.length - 1); // move it to the back of the children so far
};

/**
 * Edge - represents the edge of a pen, made up of multiple sprites
 */
GlassLab.Edge = function(pen, side) {
  this.game = pen.game;
  this.side = side;
  this.pen = pen;
  this.sprite = this.game.make.isoSprite();
  this.sprite.name = side + "Edge";

  if (side == GlassLab.Edge.SIDES.top || side == GlassLab.Edge.SIDES.bottom) {
    this.spriteName = "penRightEdge";
    this.sprite.isoX = 0.5 * GLOBAL.tileSize;
    this.horizontal = true;
  } else {
    this.spriteName = "penLeftEdge";
    this.sprite.isoY = 0.5 * GLOBAL.tileSize;
    this.horizontal = false;
  }

  this.draggable = true;
  this.dragging = false;
  this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);
};

GlassLab.Edge.prototype.Reset = function() {
  this.unusedSprites = [];
  for (var i = 0; i < this.sprite.children.length; i++) {
    this.unusedSprites.push(this.sprite.children[i]);
    this.sprite.children[i].visible = false;
  }
  if (this.horizontal) {
    this.sprite.isoY = 0;
  } else {
    this.sprite.isoX = 0;
  }
};

GlassLab.Edge.SIDES = { top: "top", bottom: "bottom", left: "left", right: "right", center: "center" }; // enum

// add a new piece or recycle one
GlassLab.Edge.prototype.PlacePiece = function(col, row) {
  this.PlacePieceAt(col * GLOBAL.tileSize, row * GLOBAL.tileSize);
};

GlassLab.Edge.prototype.PlacePieceAt = function(x, y) {
  var sprite = this.unusedSprites.pop();
  if (!sprite) {
    sprite = this.game.make.isoSprite(0, 0, 0, this.spriteName);
    //sprite.alpha = 0.3;
    sprite.anchor.set(0.5, 1.13);
    sprite.inputEnabled = true;
    sprite.input.pixelPerfectOver = true;
    sprite.input.pixelPerfectClick = true;
    sprite.events.onInputUp.add(this._onUp, this);
    sprite.events.onInputDown.add(this._onDown, this);
    sprite.events.onInputOver.add(this._onOver, this);
    sprite.events.onInputOut.add(this._onOut, this);
    switch (this.side) {
      case GlassLab.Edge.SIDES.top: sprite.input.priorityID = 1; break;
      case GlassLab.Edge.SIDES.left: sprite.input.priorityID = 2; break;
      case GlassLab.Edge.SIDES.bottom: sprite.input.priorityID = 3; break;
      case GlassLab.Edge.SIDES.right: sprite.input.priorityID = 4; break;
    } // Note: We might have to revisit and/or add priorityIDs to other things.
    this.sprite.addChild(sprite);
  }
  sprite.visible = true;
  sprite.isoX = x;
  sprite.isoY = y;
  sprite.parent.setChildIndex(sprite, sprite.parent.children.length - 1); // move it to the back of the children so far

  return sprite;
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
}

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
  for (var i = 0; i < this.sprite.children.length; i++) {
    this.sprite.children[i].tint = (on)? 0xeebbff : 0xffffff;
  }
}

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
        closestGridPos = Math.round(targetPos.y / ts);
        flooredGridPos = Math.ceil(targetPos.y / ts);
        break;
      case GlassLab.Edge.SIDES.bottom:
        targetPos.y = Math.max( cursorDifference.y, -(this.pen.height - 1) * ts);
        closestGridPos = Math.round(targetPos.y / ts);
        flooredGridPos = Math.floor(targetPos.y / ts);
        break;
      case GlassLab.Edge.SIDES.left:
        targetPos.x = Math.min( cursorDifference.x, (this.pen.leftWidth - 1) * ts);
        closestGridPos = Math.round(targetPos.x / ts);
        flooredGridPos = Math.ceil(targetPos.x / ts);
        break;
      case GlassLab.Edge.SIDES.right:
        targetPos.x = Math.max( cursorDifference.x, -(this.pen.rightWidth - 1) * ts);
        closestGridPos = Math.round(targetPos.x / ts);
        flooredGridPos = Math.floor(targetPos.x / ts);
        break;
      case GlassLab.Edge.SIDES.center:
        targetPos.x = Math.min( cursorDifference.x, (this.pen.rightWidth - 1) * ts);
        targetPos.x = Math.max( targetPos.x, -(this.pen.leftWidth - 1) * ts);
        closestGridPos = Math.round(targetPos.x / ts);
        flooredGridPos = Math.ceil(targetPos.x / ts); // is this right?>
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

GlassLab.Pen.prototype._containsTile = function(tile, leftOnly) {
  var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
  //console.log(tile.col, tile.row, originCol, originRow, this.leftWidth, this.height);
  if (tile.col < originTile.col || tile.row < originTile.row || tile.row >= originTile.row + this.height) return false;
  var leftSide = originTile.col + this.leftWidth + (leftOnly? 0 : this.rightWidth);
  return tile.col < leftSide;
};
