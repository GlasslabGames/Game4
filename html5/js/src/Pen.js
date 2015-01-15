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

  // TODO
  this.tileRoot = this.game.make.isoSprite();
  this.root.addChild(this.tileRoot).name = "tileRoot";

  this.topEdge = this.game.make.isoSprite();
  this.bottomEdge = this.game.make.isoSprite();
  this.centerEdge = this.game.make.isoSprite();
  this.rightEdge = this.game.make.isoSprite();
  this.leftEdge = this.game.make.isoSprite();

  console.log(this.root, this.topEdge);

  this.root.addChild(this.topEdge).name = "topEdge";
  this.root.addChild(this.bottomEdge).name = "bottomEdge";
  this.root.addChild(this.centerEdge).name = "centerEdge";
  this.root.addChild(this.rightEdge).name = "rightEdge";
  this.root.addChild(this.leftEdge).name = "leftEdge";

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

  for (var row = 0; row < this.height; row++) {
    for (var col = 0; col < this.leftWidth + this.rightWidth; col++) {
      var tile = tiles.pop();
      if (!tile) { // we ran out of existing tiles, so make a new one
        tile = this.game.make.isoSprite(0, 0, 0, "penBg");
        tile.anchor.set(0.5, 0);
        this.root.addChild(tile);
        this.tiles.push(tile);
      }
      tile.visible = true;
      tile.isoX = col * GLOBAL.tileSize;
      tile.isoY = row * GLOBAL.tileSize;
      tile.tint = (col < this.leftWidth)? GlassLab.Pen.LEFT_COLOR : GlassLab.Pen.RIGHT_COLOR;

      if (row == this.height - 1 ) { // on the last pass
        this.topEdge.addChild( (new GlassLab.Edge(this, GlassLab.Edge.SIDES.top, col, 0)).sprite);
        this.bottomEdge.addChild( (new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom, col, this.height)).sprite );
      }
    }

    this.leftEdge.addChild( (new GlassLab.Edge(this, GlassLab.Edge.SIDES.left, 0, row)).sprite );
    this.centerEdge.addChild( (new GlassLab.Edge(this, GlassLab.Edge.SIDES.center, this.leftWidth, row)).sprite );
    this.rightEdge.addChild( (new GlassLab.Edge(this, GlassLab.Edge.SIDES.right, this.leftWidth + this.rightWidth, row)).sprite );
  }

  // Hide any tiles we own but aren't currently using
  for (var i = 0; i < tiles.length; i++) {
    tiles[i].visible = false;
  }

}


/**
 * Edge
 */
GlassLab.Edge = function(pen, side, col, row) {
  this.game = pen.game;
  this.side = side;
  this.pen = pen;

  var spriteName = (side == GlassLab.Edge.SIDES.top || side == GlassLab.Edge.SIDES.bottom)?
    "penRightEdge" : "penLeftEdge";
  this.sprite = this.game.make.isoSprite(col * GLOBAL.tileSize, row * GLOBAL.tileSize, 0, spriteName);
  this.sprite.tint = 0x695B47;
  this.sprite.anchor.set(0.5, 0);

  this.sprite.inputEnabled = true;
  this.sprite.events.onInputUp.add(this._onUp, this);
  this.sprite.events.onInputDown.add(this._onDown, this);
}

GlassLab.Edge.SIDES = { top: "top", bottom: "bottom", left: "left", right: "right", center: "center" }; // enum

GlassLab.Edge.prototype._onDown = function( target, pointer ) {
  console.log(this.sprite.parent);
}

GlassLab.Edge.prototype._onUp = function( target, pointer ) {
  console.log(this.side);
}