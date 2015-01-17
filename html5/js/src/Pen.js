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
  this.root = this.game.make.isoSprite();
  layer.add(this.root).name = "root";
  this.tiles = [];
  this.unusedTiles = [];

  this.leftWidth = leftWidth || 1;
  this.rightWidth = rightWidth || 1;
  this.height = height || 1;

  // Add a root for all tiles now so that tiles will appear under the edges
  this.tileRoot = this.game.make.isoSprite();
  this.root.addChild(this.tileRoot).name = "tileRoot";

  this.topEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.top);
  this.bottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
  this.centerEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.center);
  this.leftEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.left);
  this.rightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);

  this.edges = [ this.topEdge, this.bottomEdge, this.centerEdge, this.leftEdge, this.rightEdge ];

  for (var i = 0; i < this.edges.length; i++) {
    this.root.addChild( this.edges[i].sprite );
  }

  this.root.isoX = 3 * GLOBAL.tileSize;
  this.root.isoY = 3 * GLOBAL.tileSize;

  this.Resize();
};

GlassLab.Pen.LEFT_COLOR = 0xA8C2EF;
GlassLab.Pen.RIGHT_COLOR = 0xF0C5CA;

GlassLab.Pen.prototype.SetSize = function(leftWidth, rightWidth, height) {
  this.leftWidth = leftWidth;
  this.rightWidth = rightWidth;
  this.height = height;
  this.Resize();
};

GlassLab.Pen.prototype.SetSizeFromEdge = function(edge) {
  var rows = Math.round(edge.sprite.isoY / GLOBAL.tileSize);
  var cols = Math.round(edge.sprite.isoX / GLOBAL.tileSize);
  console.log("left:",this.leftWidth,"right:",this.rightWidth,"height:",this.height);
  console.log("cols:", cols, "rows:", rows);

  switch (edge.side) {
    case GlassLab.Edge.SIDES.top:
      this.height -= rows;
      this.root.isoY += rows * GLOBAL.tileSize;
      break;
    case GlassLab.Edge.SIDES.bottom:
      this.height += rows;
      break;
    case GlassLab.Edge.SIDES.left:
      this.leftWidth -= cols;
      this.root.isoX += cols * GLOBAL.tileSize;
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
};

GlassLab.Pen.prototype._resetEdges = function() {
  for (var i = 0; i < this.edges.length; i++) {
    this.edges[i].Reset();
  }
};

GlassLab.Pen.prototype._resetTiles = function() {
  this.unusedTiles = [];
  for (var i = 0; i < this.tiles.length; i++) {
    this.unusedTiles.push(this.tiles[i]);
    this.tiles[i].visible = false;
  }
};

GlassLab.Pen.prototype._drawRow = function(yPos, leftCol, centerCol, rightCol) {
  for (var col = leftCol; col < rightCol; col++) {
    var tile = this.unusedTiles.pop();
    if (!tile) { // we ran out of existing tiles, so make a new one
      tile = this.game.make.isoSprite(0, 0, 0, "penBg");
      tile.anchor.set(0.5, 0.25);
      this.tileRoot.addChild(tile);
      this.tiles.push(tile);
    }
    tile.visible = true;
    tile.isoX = col * GLOBAL.tileSize;
    tile.isoY = yPos;
    tile.tint = (col < centerCol) ? GlassLab.Pen.LEFT_COLOR : GlassLab.Pen.RIGHT_COLOR;
  }

  this.leftEdge.PlacePieceAt( GLOBAL.tileSize * leftCol, yPos );
  this.centerEdge.PlacePieceAt( GLOBAL.tileSize * centerCol, yPos );
  this.rightEdge.PlacePieceAt( GLOBAL.tileSize * rightCol, yPos );
};

GlassLab.Pen.prototype._drawCol = function(xPos, topRow, bottomRow) {
  for (var row = topRow; row < bottomRow; row++) {
    var tile = this.unusedTiles.pop();
    if (!tile) { // we ran out of existing tiles, so make a new one
      tile = this.game.make.isoSprite(0, 0, 0, "penBg");
      tile.anchor.set(0.5, 0);
      this.tileRoot.addChild(tile);
      this.tiles.push(tile);
    }
    tile.visible = true;
    tile.isoX = xPos;
    tile.isoY = row * GLOBAL.tileSize;
    tile.tint = (col < this.leftWidth) ? GlassLab.Pen.LEFT_COLOR : GlassLab.Pen.RIGHT_COLOR;
  }

  this.topEdge.PlacePieceAt(xPos, topRow * GLOBAL.tileSize);
  this.bottomEdge.PlacePieceAt(xPos, bottomRow * GLOBAL.tileSize);
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
    sprite.tint = 0x695B47;
    sprite.anchor.set(0.5, 0.75);
    sprite.inputEnabled = true;
    sprite.events.onInputUp.add(this._onUp, this);
    sprite.events.onInputDown.add(this._onDown, this);
    this.sprite.addChild(sprite);
  }
  sprite.visible = true;
  sprite.isoX = x;
  sprite.isoY = y;
  return sprite;
};

GlassLab.Edge.prototype._onDown = function( target, pointer ) {
  console.log("down on",this.sprite.name);
  if (!this.dragging) {
    this.dragging = true;
    this.initialCursorIsoPos = this.game.iso.unproject(this.game.input.activePointer.position);
    Phaser.Point.divide(this.initialCursorIsoPos, this.game.world.scale, this.initialCursorIsoPos);
  }
};

GlassLab.Edge.prototype._onUp = function( target, pointer ) {
  console.log("up on",this.sprite.name);
  if (this.dragging) {
    this.dragging = false;
    this.pen.SetSizeFromEdge(this);
  }
};

GlassLab.Edge.prototype._onUpdate = function() {
  if (this.dragging) {
    var cursorIsoPosition = this.game.iso.unproject(this.game.input.activePointer.position);
    Phaser.Point.divide(cursorIsoPosition, this.game.world.scale, cursorIsoPosition);
    cursorIsoPosition = Phaser.Point.subtract(cursorIsoPosition, this.initialCursorIsoPos);
    var ts = GLOBAL.tileSize;
    var row = Math.round(cursorIsoPosition.y / ts);
    var col = Math.round(cursorIsoPosition.x / ts);
    var targetPos = { x: this.sprite.isoX, y: this.sprite.isoY };

    // I'm not sure if we want to have the edge stick to the grid yet, so do the calculations for both
    switch (this.side) {
      case GlassLab.Edge.SIDES.top:
        row = Math.min(row, this.pen.height - 1);
        targetPos.y = Math.min( cursorIsoPosition.y, (this.pen.height - 1) * ts);
        break;
      case GlassLab.Edge.SIDES.bottom:
        row = Math.max(row, -(this.pen.height - 1));
        targetPos.y = Math.max( cursorIsoPosition.y, -(this.pen.height - 1) * ts);
        break;
      case GlassLab.Edge.SIDES.left:
        col = Math.min(col, this.pen.leftWidth - 1);
        targetPos.x = Math.min( cursorIsoPosition.x, (this.pen.leftWidth - 1) * ts);
        break;
      case GlassLab.Edge.SIDES.right:
        col = Math.max(col, -(this.pen.rightWidth - 1));
        targetPos.x = Math.max( cursorIsoPosition.x, -(this.pen.rightWidth - 1) * ts);
        break;
      case GlassLab.Edge.SIDES.center:
        col = Math.min(col, this.pen.rightWidth - 1);
        col = Math.max(col, -(this.pen.leftWidth - 1));
        targetPos.x = Math.min( cursorIsoPosition.x, (this.pen.rightWidth - 1) * ts);
        targetPos.x = Math.max( targetPos.x, -(this.pen.leftWidth - 1) * ts);
        break;
    }

    if (targetPos.x != this.sprite.isoX || targetPos.y != this.sprite.isoY) {
      // allow different options for how the handles move ( ideally we could put these in the game for pepole to try)
      var lerpFactor = 0.2; // 0: no snap, 0.2: some snap, 1: full snap
      if (lerpFactor > 0) {
        if (this.horizontal) this.sprite.isoY = (1 - lerpFactor) * this.sprite.isoY + lerpFactor * row * ts;
        else this.sprite.isoX = (1 - lerpFactor) * this.sprite.isoX + lerpFactor * col * ts;
      } else {
        if (this.horizontal) this.sprite.isoY = targetPos.y;
        else this.sprite.isoX = targetPos.x;
      }
    }

  }
};

/**
 * Feeding Pen - holds animals on the left and food on the right
 */
GlassLab.FeedingPen = function(game, layer, animalWidth, foodWidth, height) {
  var pen = new GlassLab.Pen(game, layer, animalWidth, foodWidth, height);

  for (var col = 1; col <= animalWidth; col++) {
    for (var row = 1; row <= height; row++) {
      var creature = new GlassLab.Creature(game, "sheep", "WaitingForFood");
      GLOBAL.creatureLayer.add(creature.sprite);
      creature.sprite.isoX = col * GLOBAL.tileSize + pen.root.isoX;
      creature.sprite.isoY = row * GLOBAL.tileSize + pen.root.isoY;
      creature.sprite.scale.x = creature.sprite.scale.y = .25;
      creature.sprite.scale.x *= -1;
    }
  }

  return pen;
};

GlassLab.FeedingPen.prototype = GlassLab.Pen.prototype; // extend pen