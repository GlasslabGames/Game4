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

  this.topEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.top);
  this.bottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
  this.centerEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.center);
  this.leftEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.left);
  this.rightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);

  this.edges = [ this.topEdge, this.bottomEdge, this.centerEdge, this.leftEdge, this.rightEdge ];


  this.root.addChild(this.topEdge.sprite);
  this.root.addChild(this.leftEdge.sprite);

  // Add a root for all tiles now so that tiles will appear under the edges
  this.tileRoot = this.game.make.isoSprite();
  this.root.addChild(this.tileRoot).name = "tileRoot";

  // Add a root for all objects that will be added
  this.objectRoot = this.game.make.isoSprite();
  this.root.addChild(this.objectRoot).name = "objectRoot";

  this.root.addChild(this.centerEdge.sprite);
  this.root.addChild(this.bottomEdge.sprite);
  this.root.addChild(this.rightEdge.sprite);

  this.root.isoX = 3 * GLOBAL.tileSize;
  this.root.isoY = 3 * GLOBAL.tileSize;

  var style = { font: "65px Arial Black", fill: "#ffffff", align: "center", stroke: "#000000", strokeThickness: 8 };
  this.ratioLabel = game.make.text(0, 0, "1 : 2", style);
  this.ratioLabel.anchor.set(0.5, 1);
  this.root.addChild(this.ratioLabel);
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

  this.ratioLabel.text = (this.leftWidth * this.height) + " : " + (this.rightWidth * this.height);
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
    this._placeTile(col * GLOBAL.tileSize, yPos, (col < centerCol));
  }

  this.leftEdge.PlacePieceAt( GLOBAL.tileSize * leftCol, yPos );
  this.centerEdge.PlacePieceAt( GLOBAL.tileSize * centerCol, yPos );
  this.rightEdge.PlacePieceAt( GLOBAL.tileSize * rightCol, yPos );
};

GlassLab.Pen.prototype._drawCol = function(xPos, topRow, bottomRow) {
  for (var row = topRow; row < bottomRow; row++) {
    this._placeTile(xPos, row * GLOBAL.tileSize, (col < this.leftWidth));
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
    sprite.alpha = 0.3;
    sprite.anchor.set(0.5, 1.13);
    sprite.inputEnabled = true;
    sprite.events.onInputUp.add(this._onUp, this);
    sprite.events.onInputDown.add(this._onDown, this);
    sprite.events.onInputOver.add(this._onOver, this);
    sprite.events.onInputOut.add(this._onOut, this);
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

/**
 * Feeding Pen - holds animals on the left and food on the right
 */
GlassLab.FeedingPen = function(game, layer, animalWidth, foodWidth, height) {
  this.foods = [];
  this.creatures = [];
  this.foodByRow = [];
  this.feeding = false;

  GlassLab.Pen.call(this, game, layer, animalWidth, foodWidth, height);

  this.centerEdge.sprite.parent.removeChild( this.centerEdge.sprite ); // for now don't draw the center
  this.SetDraggableOnly(GlassLab.Edge.SIDES.right);

  this.key2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
  this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

  this.ratioLabel.x -= GLOBAL.tileSize * 0.75;
  this.button = game.add.button(this.topEdge.sprite.x + GLOBAL.tileSize * 0.75, this.topEdge.sprite.y - GLOBAL.tileSize * 1.5,
    'button', this.FeedCreatures, this, 1, 0, 1);
  this.button.anchor.set(0.5, 1);
  this.root.addChild(this.button);

  GLOBAL.testPen = this; // for testing
};

GlassLab.FeedingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.FeedingPen.constructor = GlassLab.FeedingPen;

GlassLab.FeedingPen.prototype.Resize = function() {
  GlassLab.Pen.prototype.Resize.call(this);

  this.FillIn(GlassLab.Food.bind(null, this.game, "food"), this.foods, this.numFood,
    this.leftWidth, this.leftWidth + this.rightWidth);
  this.FillIn(GlassLab.Creature.bind(null, this.game, "sheep", "WaitingForFood"), this.creatures, this.numCreatures,
    0, this.leftWidth, true);

  if (this.numFood && this.numCreatures) {
    this.ratioLabel.text = this.numCreatures + " : " + this.numFood;
  }

  this.foodByRow = []; // clear foodByRow so that we know to recalculate it next time we need it
};

function TestSetContents(numCreatures, numFood, resize) {
  if (GLOBAL.testPen) {
    GLOBAL.testPen.SetContents(numCreatures, numFood, resize);
    return {height: GLOBAL.testPen.height, animalCols: GLOBAL.testPen.leftWidth, foodCols: GLOBAL.testPen.rightWidth};
  }
}

// if we allow condensing odd numbers to multiple rows, this determines when to start condensing
GlassLab.FeedingPen.MAX_PEN_HEIGHT = 5;

// Resizes the pen to contain the specified number of creatures and food
// If condenseToMultipleRows is true, it will add creatures in multiple rows where appropriate.
/* FIXME: If we want to condenseToMultipleRows (currently we do not), fix how the carrots are added
   so that cases like 7:14 and 4:5 both work. Currently we add food by column first, so that 4:5 (which might happen,
   but won't be correct) looks better. If we allow 7 creatures to be split into 2 cols, we have to make sure that
   7:14 still works since it's actually a (possible) correct solution.
  */
GlassLab.FeedingPen.prototype.SetContents = function(numCreatures, numFood, condenseToMultipleRows) {
  this.SetDraggableOnly(); // don't allow them to adjust the pen

  this.numCreatures = numCreatures;
  this.numFood = numFood;

  if (!condenseToMultipleRows) {
    this.leftWidth = 1;
    this.height = numCreatures;
  } else if (numCreatures == 9 && GlassLab.FeedingPen.MAX_PEN_HEIGHT < 9) {
    // I'm adding this one special case because 3x3 is a lot better than two columns of 4 and 5.
    // Suggestions for a general algorithm that would better deal with this case are welcome.
    this.height = this.leftWidth = 3;
  } else {
    this.height = numCreatures;
    this.leftWidth = 1;

    while (this.height > GlassLab.FeedingPen.MAX_PEN_HEIGHT) {
      this.leftWidth++;
      this.height = Math.ceil(numCreatures / this.leftWidth);
    }
  }

  this.rightWidth = Math.ceil(numFood / this.height);
  this.Resize();
};

GlassLab.FeedingPen.prototype.FillIn = function(boundConstructor, list, maxCount, startCol, endCol, fromRight) {
  var unusedObjects = list.slice();
  var count = 0;

  for (var col = startCol; col < endCol; col ++) {
    for (var row = 0; row < this.height; row++) {
        var obj  = unusedObjects.pop();
      if (!obj) { // we ran out of existing tiles, so make a new one
        obj = new boundConstructor();
        this.objectRoot.addChild(obj.sprite);
        list.push(obj);
      }
      obj.sprite.visible = true;
      obj.sprite.isoX = (fromRight? endCol - col - 1 : col) * GLOBAL.tileSize;
      obj.sprite.isoY = row * GLOBAL.tileSize;
      obj.sprite.parent.setChildIndex(obj.sprite, obj.sprite.parent.children.length - 1); // move it to the back of the children so far
      obj.pen = this;
      count++;
      if (count >= maxCount) break;
    }
    if (count >= maxCount) break;
  }

  for (var i = 0; i < unusedObjects.length; i++) {
    unusedObjects[i].sprite.visible = false;
  }
};

GlassLab.FeedingPen.prototype._onUpdate = function() {
  if (this.key2.justDown && !this.feeding) {
    this.FeedCreatures();
  }
};

GlassLab.FeedingPen.prototype.FeedCreatures = function() {
  console.log("Start feeding");
  this.unfedCreatures = this.unsatisfiedCreatures = this.creatures.length;
  this.feeding = true;
  this.button.visible = false;
  this.SetDraggableOnly(); // make all edges undraggable

  // Start creatures moving and assign food to the creature that should eat it
  var foodByRow = this._sortObjectsByGrid(this.foods, false, -this.leftWidth);
  var creaturesByRow = this._sortObjectsByGrid(this.creatures, false);

  for (var row = 0; row < foodByRow.length; row++) {
    var creatureRow = creaturesByRow[row];

    // 1. start the creatures eating
    for (var col = 0; col < creatureRow.length; col++) {
      var creature = creatureRow[col];
      if (!creature) continue; // when there's an uneven number of creatures, the creatures might start at 1 instead of 0
      var time = ((creatureRow.length - col) - Math.random()) * Phaser.Timer.SECOND / 2; // delay the start so that the right col moves first
      this.game.time.events.add(time, creature.state.StartWalkingToFood, creature.state);
    }

    // 2. assign the food to the creature that should eat it
    while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

    var foodRow = foodByRow[row];
    var extraCols = foodRow.length % creatureRow.length; // cols that aren't evenly divided for the number of creatures

    for (var col = 0; col < foodRow.length; col++) {
      var index = col % creatureRow.length; // divide up the food among the cols of creatures
      if (col >= foodRow.length - extraCols) { // assign this food differently since it can't be evenly divided
        index += creatureRow.length - extraCols; // skip the columns of creatures who don't fit in these extra cols
      }
      creatureRow[ index ].targetFood.push( foodRow[col] ); // tell the creature at that index to eat this food
    }
  }
};

GlassLab.FeedingPen.prototype.GetNextFoodInCreatureRow = function(creature) {
  if (!this.foodByRow || !this.foodByRow.length) this.foodByRow = this._sortObjectsByGrid(this.foods);
  var row = Math.round(creature.sprite.isoY / GLOBAL.tileSize);
  return (this.foodByRow[row])? this.foodByRow[row].shift() : null;
};


GlassLab.FeedingPen.prototype.GetNextFoodInRow = function(row) {
  if (!this.foodByRow || !this.foodByRow.length) this.foodByRow = this._sortObjectsByGrid(this.foods);
  return (this.foodByRow[row])? this.foodByRow[row].shift() : null;
};

GlassLab.FeedingPen.prototype._sortObjectsByGrid = function(fromList, byCol, colOffset) {
  var toList = [];
  colOffset = colOffset || 0;
  for (var i = 0; i < fromList.length; i++) {
    if (!fromList[i].sprite.visible) continue;
    var row = Math.round(fromList[i].sprite.isoY / GLOBAL.tileSize);
    var col = Math.round(fromList[i].sprite.isoX / GLOBAL.tileSize);
    if (byCol) {
      if (!toList[col]) toList[col] = [];
      toList[col][row] = fromList[i];
    } else { // by row
      if (!toList[row]) toList[row] = [];
      toList[row][col + colOffset] = fromList[i];
    }
  }
  return toList;
};

GlassLab.FeedingPen.prototype.SetCreatureFinishedEating = function(satisfied) {
  this.unfedCreatures --;
  if (satisfied) this.unsatisfiedCreatures --;
  if (this.unfedCreatures <= 0) {
    var success = this.unsatisfiedCreatures <= 0;
    this.FinishFeeding(success);
  }
};

GlassLab.FeedingPen.prototype.FinishFeeding = function(win) {
  console.log("Finished feeding creatures! Success?",win);
  if (this.finished) return;
  this.finished = true;

  this.game.time.events.add(Phaser.Timer.SECOND, function() {
    if (win)
    {
      GLOBAL.levelManager.CompleteCurrentLevel();

      GLOBAL.Journal.Show();

      GlassLab.SignalManager.levelWon.dispatch();
    }
    else
    {
      GlassLab.SignalManager.levelLost.dispatch();
    }
  }, this);

};

/**
 * Food - just a sprite for now
 */
GlassLab.Food = function(game, spriteName) {
  this.sprite = game.make.isoSprite(0,0,0, spriteName);
  this.sprite.scale.x = this.sprite.scale.y = 0.75;
  this.game = game;
  this.sprite.anchor.setTo(0.5, 0.5);
};


GlassLab.Food.prototype.print = function()
{
  var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
  var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
  return "Food("+col+", "+row+")";
}