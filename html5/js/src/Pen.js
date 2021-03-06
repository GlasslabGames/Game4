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
            this.rightEdges[i].setVisible(true);
        } else {
            this.rightEdges[i].setVisible(false);
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
            }
            this._drawBgAtTile(col, row, tile);
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

    var centerCol = GLOBAL.tileManager.GetMapWidth() / 2;
    var centerRow = GLOBAL.tileManager.GetMapHeight() / 2;
    var halfWidth =  Math.round(GLOBAL.penAreaWidth / 2);
    var halfHeight = Math.round(GLOBAL.penAreaHeight / 2);
    var minRow = centerRow - halfHeight, maxRow = centerRow + halfHeight, minCol = centerCol - halfWidth, maxCol = centerCol + halfWidth;

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
            if (!obj || !obj.parent) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                if (parent.addChild) parent.addChild(obj); // if the parent is a sprite
                else parent.add(obj); // if the parent is a group
                if (obj.draggableComponent) obj.draggableComponent.setActive(false); // prevent dragging it out of the pen
            }
            obj.visible = true;
            obj.alpha = (typeof alpha != 'undefined')? alpha : 1;
            obj.pen = this;
            obj.inputEnabled = false;

            if (targetType && obj.setType) obj.setType(targetType, animate);
            if (obj.reset) obj.reset();
            obj.name = targetType+" "+col+", "+row;

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

// Static function that calculates the non-iso width and height of a pen with a given iso full width and height
GlassLab.Pen.CalculateProjectedHeight = function(fullWidth, height) {
    if (!GLOBAL.game) return 0;

    var bottomPoint = new Phaser.Point(fullWidth * GLOBAL.tileSize, height * GLOBAL.tileSize); // the isopos of the bottommost point of the pen
    bottomPoint = GLOBAL.game.iso.projectXY(bottomPoint);
    return bottomPoint.y; // height (since the pen's top is at 0)
};

GlassLab.Pen.CalculateProjectedWidth = function(fullWidth, height) {
    if (!GLOBAL.game) return 0;

    var leftPoint = new Phaser.Point(0, height * GLOBAL.tileSize); // the isopos of the bottommost point of the pen
    leftPoint = GLOBAL.game.iso.projectXY(leftPoint);
    var rightPoint = new Phaser.Point(fullWidth * GLOBAL.tileSize, 0); // the isopos of the bottommost point of the pen
    rightPoint = GLOBAL.game.iso.projectXY(rightPoint);

    return rightPoint.x - leftPoint.x; // how wide the pen is
};

// Used by ShippingPen and FeedingPen to check the pen results
GlassLab.Pen.prototype.calculateResult = function(targetNumCreatures, targetTotalFood) {
    var info = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
    var problems = [];

    // The highest priority problem is when the food types don't match, so check that first
    var checkIfDesiredFood = function(foodType) {
        for (var i = 0; i < info.desiredFood.length; i++) {
            if (info.desiredFood[i].type == foodType) return true;
        }
        return false;
    };
    for (var i = 0; i < this.foodTypes.length; i++) {
        if (this.foodTypes[i] && !checkIfDesiredFood(this.foodTypes[i])) problems.push(this.foodTypes[i]); // record that this food type was incorrect
    }
    if (problems.length) return { result: GlassLab.results.dislike, problems: problems }; // we found some disliked food types

    // Then we have a targetTotalFood, check if the sum of the food we sent matches it.
    if (targetTotalFood && this.numFoods.length > 1 && this.numFoods[0] + this.numFoods[1] != targetTotalFood) {
        // Check which are wrong
        for (var i = 0; i < info.desiredFood.length; i++) {
            var type = info.desiredFood[i].type;
            var index = this.foodTypes.indexOf(type);
            var targetAmount = info.desiredFood[i].amount * targetNumCreatures;
            if (targetAmount != this.numFoods[index]) problems.push(type); // we found an incorrect food count
        }
        return { result: GlassLab.results.wrongFoodSum, problems: problems };
    }

    // Next, check if the number of creatures is correct
    var currentNumCreatures = (this.getNumCreatures && this.getNumCreatures()) || this.numCreatures || 0; // 1. feeding pen 2. shipping pen
    var incorrectNumCreatures = (targetNumCreatures && targetNumCreatures != currentNumCreatures);

    // Now, there's a special case where only one food was provided.
    // The result itself is determined by the food that doesn't match numCreatures, but we need to note whether the other food matches the targetNumCreatures as well.
    var foodsThatDontMatchTargetNumCreatures = [];

    var result = GlassLab.results.satisfied; // unless we discover a problem with one of the food types
    for (var i = 0; i < info.desiredFood.length; i++) { // for each food the creature wants to eat
        var type = info.desiredFood[i].type;
        var index = this.foodTypes.indexOf(type);
        if (index == -1) console.error(type,"wasn't found in Pen.foodTypes even though we should have checked for wrong food type already!");
        else {
            var targetAmount = info.desiredFood[i].amount * currentNumCreatures;
            var currentAmount = (this.numFoods && parseInt(this.numFoods[index])) || (this.widths[index+1] && (this.widths[index+1] * this.height)) || 0; // 1. shipping 2. feeding
            //console.log(type, "target:",targetAmount,"provided:",currentAmount);

            if (currentAmount + 0.01 < targetAmount) { // add a little wiggle room
                if (result == GlassLab.results.satisfied) result = GlassLab.results.hungry; // only override "satisfied" - always keep on the first bad result
                problems.push(type);
            } else if (currentAmount > targetAmount + 0.01) {
                if (result == GlassLab.results.satisfied) result = GlassLab.results.sick;
                problems.push(type);
            } // else they're satisfied with this food at least

            if (incorrectNumCreatures) { // if the number of creatures is incorrect, also check against the amount for the correct number of creatures
                var realTargetAmount = info.desiredFood[i].amount * targetNumCreatures;
                //console.log(type, "realTarget:",realTargetAmount,"provided:",currentAmount);
                if (currentAmount + 0.01 < realTargetAmount || currentAmount > realTargetAmount + 0.01) { // add a little wiggle room
                    foodsThatDontMatchTargetNumCreatures.push(type);
                }
            }
        }
    }

    // If the entered number of creatures is wrong, the problems are "creature" plus whichever food doesn't match the targetNumCreatures.
    if (incorrectNumCreatures) {
        problems = foodsThatDontMatchTargetNumCreatures.concat("creature");
    }
    // Else problems will be whatever food doesn't match the number of creatures.

    // When the problem used totalFood, we want to judge sick/hungry based on the total food rather than individual food
    // (But we still had to go through each food individually to figure out
    if (incorrectNumCreatures && targetTotalFood) {
        var totalDesiredFood = info.desiredFood[0].amount + info.desiredFood[1].amount;
        if (totalDesiredFood * currentNumCreatures + 0.01 < targetTotalFood) { // not enough creatures
            result = GlassLab.results.sick;
        } else if (totalDesiredFood * currentNumCreatures - 0.01 > targetTotalFood) { // too many creatures
            result = GlassLab.results.hungry;
        }
    }

    return {result: result, problems: problems};
};