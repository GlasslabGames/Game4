/**
 * Created by Rose Abernathy on 1/14/2015.
 */

var GlassLab = GlassLab || {};
var GLOBAL = GLOBAL || {};

/**
 * Pen
 */
GlassLab.Pen = function(game, layer)
{
  this.game = game;
  this.layer = layer;
  this.root = this.game.make.isoSprite();
  layer.add(this.root).name = "root";
  this.tiles = [];

  this.leftWidth = 1;
  this.rightWidth = 1;
  this.height = 1;

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

  this.SetSize(2,3,2);
};

GlassLab.Pen.LEFT_COLOR = 0xA8C2EF;
GlassLab.Pen.RIGHT_COLOR = 0xF0C5CA;

GlassLab.Pen.prototype.SetSize = function(leftWidth, rightWidth, height) {
  this.leftWidth = leftWidth;
  this.rightWidth = rightWidth;
  this.height = height;
  this.Resize();
}

GlassLab.Pen.prototype.Resize = function() {
  // Lay out tiles to fill in all the rows and columns in the pen

  var tiles = this.tiles.slice(); // copy array

  for (var i = 0; i < this.edges.length; i++) {
    this.edges[i].Reset();
  }

  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.leftWidth + this.rightWidth; col++) {
      var tile = tiles.pop();
      if (!tile) { // we ran out of existing tiles, so make a new one
        tile = this.game.make.isoSprite(0, 0, 0, "penBg");
        tile.anchor.set(0.5, 0);
        this.tileRoot.addChild(tile);
        this.tiles.push(tile);
      }
      tile.visible = true;
      tile.isoX = col * GLOBAL.tileSize;
      tile.isoY = row * GLOBAL.tileSize;
      tile.tint = (col < this.leftWidth)? GlassLab.Pen.LEFT_COLOR : GlassLab.Pen.RIGHT_COLOR;

      if (row == 0 ) { // do these once for each col
        this.topEdge.PlacePiece(col, 0);
        this.bottomEdge.PlacePiece(col, this.height);
      }
    }

    this.leftEdge.PlacePiece( 0, row );
    this.centerEdge.PlacePiece( this.leftWidth, row );
    this.rightEdge.PlacePiece( this.leftWidth + this.rightWidth, row );
  }

  // Hide any tiles we own but aren't currently using
  for (var i = 0; i < tiles.length; i++) {
    tiles[i].visible = false;
  }

}


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
  } else {
    this.spriteName = "penLeftEdge";
    this.sprite.isoY = 0.5 * GLOBAL.tileSize;
  }
}

GlassLab.Edge.prototype.Reset = function() {
  this.unusedSprites = [];
  for (var i = 0; i < this.sprite.children.length; i++) {
    this.unusedSprites.push(this.sprite.children[i]);
    this.sprite.children[i].visible = false;
  }
}

GlassLab.Edge.SIDES = { top: "top", bottom: "bottom", left: "left", right: "right", center: "center" }; // enum

// add a new piece or recycle one
GlassLab.Edge.prototype.PlacePiece = function(col, row) {
  var sprite = this.unusedSprites.pop();
  if (!sprite) {
    sprite = this.game.make.isoSprite(0, 0, 0, this.spriteName);
    sprite.tint = 0x695B47;
    sprite.anchor.set(0.5, 0);
    sprite.inputEnabled = true;
    sprite.events.onInputUp.add(this._onUp, this);
    sprite.events.onInputDown.add(this._onDown, this);
    this.sprite.addChild(sprite);
  }
  sprite.visible = true;
  sprite.isoX = col * GLOBAL.tileSize;
  sprite.isoY = row * GLOBAL.tileSize;
}

GlassLab.Edge.prototype._onDown = function( target, pointer ) {
  console.log("down on",this.sprite.name);
}

GlassLab.Edge.prototype._onUp = function( target, pointer ) {
  console.log("up on",this.sprite.name);
}