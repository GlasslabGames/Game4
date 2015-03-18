/**
 * Created by Rose Abernathy on 2/5/2015.
 */

/**
 * Feeding Pen - holds animals on the left and food on the right
 */
GlassLab.FeedingPen = function(game, layer, creatureType, height, widths, autoFill) {
    this.foodLists = []; // list of food objects, divided by section
    this.creatures = [];
    this.creatureSpots = []; // 2d array of creatures, on per spot in the pen
    this.feeding = false;

    this.creatureType = creatureType; // note that this is the target creature type, not necessarily the current creature type
    this.foodTypes = []; // foodTypes will stay empty until the player adds a kind of food

    this.autoFill = autoFill; // whether creatures to fill the pen are magically created
    this.allowFeedButton = true;

    GlassLab.Pen.call(this, game, layer, height, widths);

    // Instead of adding everything to objectRoot, make parents for the food and creatures so we can order them
    this.foodRoot = this.game.make.isoSprite();
    this.objectRoot.addChild(this.foodRoot);

    this.creatureRoot = this.game.make.isoSprite();
    this.objectRoot.addChild(this.creatureRoot);

    this.SetDraggableOnly(GlassLab.Edge.SIDES.right);

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.onResolved = new Phaser.Signal();

    this.ratioLabel.x -= GLOBAL.tileSize * 0.75;
    this.button = game.add.button(this.topEdge.sprite.x + GLOBAL.tileSize * 1.25, this.topEdge.sprite.y - GLOBAL.tileSize * 1.5,
        'button', this.FeedCreatures, this, 1, 0, 1);
    this.button.anchor.set(0.5, 1);
    this.sprite.addChild(this.button);
    this.button.visible = false;
    this._onCreatureContentsChanged(); // refresh the button visibility

    this.sprite.events.onDestroy.add(this.Destroy, this);

    this.id = GLOBAL.penManager.pens.length;
    GLOBAL.penManager.AddPen(this);
};

GlassLab.FeedingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.FeedingPen.constructor = GlassLab.FeedingPen;

GlassLab.FeedingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);

    this._updateCreatureSpotsAfterResize();

    // Fill in the food to each section
    var startCol = this.widths[0];
    for (var i = 0, len = this.foodTypes.length; i < len; i++) {
        if (!this.foodTypes[i] || !GlassLab.FoodTypes[this.foodTypes[i]]) {
            startCol += this.widths[i+1]; // go to the next section
            continue; // don't fill anything in
        }
        while (this.foodLists.length <= i) this.foodLists.push([]);
        var maxFood = (this.numFoods)? this.numFoods[i] : null;
        this.FillIn(GlassLab.Food.bind(null, this.game, this.foodTypes[i]), this.foodRoot, this.foodLists[i], maxFood,
            startCol, startCol += this.widths[i+1], false, this.foodTypes[i]);
    }

    if (this.autoFill) {
        this.FillIn(GlassLab.Creature.bind(null, this.game, this.creatureType, this), this.creatureRoot, this.creatureSpots, this.numCreatures,
            0, this.widths[0], true, this.creatureType);
        this.forEachCreature(function() { this.draggable = false; });
    } else {
        this._repositionCreatures(); // adjust the creatures if they got moved

        // For each tile in the creature side, mark that it's open for creatures - deprecated
        /*
        for (var col = 0; col < this.widths[0]; col++) {
            for (var row = 0; row < this.height; row++) {
                var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
                if (tile) tile.setInPen(this, this.creatureType);
            }
        }*/
    }

    // If we've set a specific number of food & creatures, use that instead of the default which was set in Pen
    // But it would be better to rewrite the Pen one to count the number of food / creatures currently in the pen.
    if (this.numFoods && this.numCreatures) {
        this.ratioLabel.text = this.numCreatures;
        for (var l = 0; l < this.numFoods.length; l++) {
            this.ratioLabel.text += " : " + this.numFoods[l];
        }
    }

    this._onCreatureContentsChanged();
};

GlassLab.FeedingPen.prototype._updateCreatureSpotsAfterResize = function() {
    var tileDif = new Phaser.Point(0,0);
    if (this.prevIsoPos) {
        var posDif = Phaser.Point.subtract(this.sprite.isoPosition, this.prevIsoPos);
        tileDif.setTo(Math.round(posDif.x / GLOBAL.tileSize), Math.round(posDif.y / GLOBAL.tileSize));
    }

    if (!tileDif.isZero()) { // we moved the origin, so add or remove rows or columns from the front
        while (tileDif.y < 0) {
            this.creatureSpots.unshift(new Array(this.widths[0])); // add an empty row to the beginning
            tileDif.y++;
        }
        while (tileDif.y > 0) {
            this._removeCreaturesInRow(this.creatureSpots.shift(), posDif); // remove the first row
            tileDif.y --;
        }


        while (tileDif.x < 0) {
            for (var row = 0; row < this.creatureSpots.length; row++) {
                this.creatureSpots[row].unshift(null); // add null to the beginning of the column
            }
            tileDif.x++;
        }
        while (tileDif.x > 0) {
            for (var row = 0; row < this.creatureSpots.length; row++) {
                var creature = this.creatureSpots[row].shift(); // remove the first element
                if (creature) this._removeCreature(creature, posDif);
            }
            tileDif.x --;
        }
    }

    // Then if our pen is the wrong size (because we moved a the bottom/right edge), add/remove rows or columns until the size is right
    // First, if we increased the size of the pen, add new emtpy rows or columns
    while (this.creatureSpots.length < this.height) this.creatureSpots.push([]);
    for (var row = 0; row < this.creatureSpots.length; row++) {
        while (this.creatureSpots[row].length < this.widths[0]) this.creatureSpots[row].push(null);
    }

    // Then, if we decreased the size of the pen, remove rows or columns
    while (this.creatureSpots.length > this.height) {
        this._removeCreaturesInRow(this.creatureSpots.pop());
    }
    for (var row = 0; row < this.creatureSpots.length; row++) {
        while (this.creatureSpots[row].length > this.widths[0]) {
            var creature = this.creatureSpots[row].pop();
            if (creature) this._removeCreature(creature);
        }
    }
};

// if we allow condensing odd numbers to multiple rows, this determines when to start condensing
GlassLab.FeedingPen.MAX_PEN_HEIGHT = 5;

// Resizes the pen to contain the specified number of creatures and food
// If condenseToMultipleRows is true, it will add creatures in multiple rows where appropriate.
/* FIXME: If we want to condenseToMultipleRows (currently we do not), fix how the carrots are added
 so that cases like 7:14 and 4:5 both work. Currently we add food by column first, so that 4:5 (which might happen,
 but won't be correct) looks better. If we allow 7 creatures to be split into 2 cols, we have to make sure that
 7:14 still works since it's actually a (possible) correct solution.
 */
GlassLab.FeedingPen.prototype.SetContents = function(creatureType, numCreatures, foodTypes, numFoods, condenseToMultipleRows) {
    this.SetDraggableOnly(); // don't allow them to adjust the pen

    this.creatureType = creatureType;
    this.foodTypes = foodTypes || [];

    this.numCreatures = numCreatures || 0;
    this.numFoods = numFoods || []; // should be an array
    this.autoFill = true; // if we're setting the number of creatures like this (ie for an order), assume we want to autofill

    this.penStyle = GlassLab.Pen.STYLES.crate;
    // move the creatures to be in front of the topEdge
    this.objectRoot.parent.setChildIndex(this.objectRoot, this.objectRoot.parent.getChildIndex(this.topEdge.sprite));

    if (!condenseToMultipleRows) {
        this.widths[0] = 1;
        this.height = numCreatures;
    } else if (numCreatures == 9 && GlassLab.FeedingPen.MAX_PEN_HEIGHT < 9) {
        // I'm adding this one special case because 3x3 is a lot better than two columns of 4 and 5.
        // Suggestions for a general algorithm that would better deal with this case are welcome.
        this.height = this.widths[0] = 3;
    } else {
        this.height = numCreatures;
        this.widths[0] = 1;

        while (this.height > GlassLab.FeedingPen.MAX_PEN_HEIGHT) {
            this.widths[0]++;
            this.height = Math.ceil(numCreatures / this.widths[0]);
        }
    }

    for (var j = 0; j < this.numFoods.length; j++) {
        this.widths[j+1] = Math.ceil(this.numFoods[j] / this.height);
        if (j < this.numFoods.length - 1) this.rightEdges[j].sprite.visible = false;
    }
    this.centerEdge.sprite.visible = false;

    this.sprite.isoY = -Math.floor(this.height / 2.0) * GLOBAL.tileManager.tileSize; // TODO: HACK FOR CENTER PLACEMENT

    this.Resize();
};

GlassLab.FeedingPen.prototype.FillIn = function(boundConstructor, parent, list, maxCount, startCol, endCol, fromRight, targetType) {
    var unusedObjects = Array.prototype.concat.apply([], list); // flatten the 2D list into a new array
    var count = 0;
    list.length = 0; // empty the list. Setting it to [] would break the passed-in reference.

    for (var row = 0; row < this.height; row++) {
        list.push([]);
        for (var col = startCol; col < endCol; col ++) {
            var obj  = unusedObjects.pop();
            if (!obj) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                parent.addChild(obj.sprite);
            }
            obj.setType(targetType);
            obj.sprite.visible = true;
            obj.sprite.isoX = (fromRight? endCol - col - 1 : col) * GLOBAL.tileSize;
            obj.sprite.isoY = row * GLOBAL.tileSize;
            obj.sprite.parent.setChildIndex(obj.sprite, obj.sprite.parent.children.length - 1); // move it to the back of the children so far
            obj.pen = this;
            list[row].push(obj);
            count++;
            if (maxCount && count >= maxCount) break;
        }
        if (maxCount && count >= maxCount) break;
    }

    for (var i = 0; i < unusedObjects.length; i++) {
        unusedObjects[i].sprite.visible = false;
    }
};

GlassLab.FeedingPen.prototype._onUpdate = function() {
};

GlassLab.FeedingPen.prototype.FeedCreatures = function() {
    //this.RefreshCreatures();
    this._refreshFeedButton(true);
    if (!this.autoFill && !this.canFeed) {
        console.error("Tried to feed creatures but ran into discrepancy with number of creatures. Try again.");
        return;
    }

    this.unfedCreatures = this.unsatisfiedCreatures = this.getNumCreatures();
    this.feeding = true;
    this.button.visible = false;
    this.SetDraggableOnly(); // make all edges undraggable
    for (var i = 0; i < this.rightEdges.length - 1; i++) {
        this.rightEdges[i].sprite.visible = false; // hide the middle fences
    }

    // if there's a gate, move the creatures to be in front of the centerEdge
    if (this.penStyle == GlassLab.Pen.STYLES.gate) {
        this.objectRoot.parent.setChildIndex(this.objectRoot, this.objectRoot.parent.getChildIndex(this.topEdge.sprite));
    }

    // close the items
    GLOBAL.inventoryMenu.Hide(true);

    // Reset creature foods in case anything weird happened before
    this.forEachCreature(GlassLab.Creature.prototype.resetTargetFood);

    var desiredFood = this.creatureSpots[0][0].desiredAmountsOfFood; // we can't feed if all spots aren't filled in with the same type of creature, so this should work

    // For each section of food, calculate which foods should go to which creatures
    for (var i = 0; i < this.foodTypes.length; i++) {
        if (!this.foodTypes[i] || !this.foodLists[i]) continue;

        var foodRows = this.foodLists[i];
        var desiredAmount = desiredFood[this.foodTypes[i]];

        console.log(this.foodLists[i]);

        if (true) { // easy way of assigning food - divide it into sections. This won't work for fractional food!
            for (var row = 0; row < foodRows.length; row++) {
                var foodRow = foodRows[row];
                var creatureRow = this.creatureSpots[row];

                if (!foodRow || !creatureRow) continue; // ignore any empty rows
                while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

                // If the food isn't evenly divisible, some lucky creatures get to eat more than others.
                var bigN = Math.ceil(foodRow.length / creatureRow.length); // number of foods per creature for the lucky creatures
                var littleN = Math.floor(foodRow.length / creatureRow.length); // number of foods per creature for the unlucky creatures
                var luckyCreatures = foodRow.length % creatureRow.length;

                // For each creature, assign it the appropriate amount of food (more if it's lucky or less if it's unlucky.)
                var foodCol = -1;
                for (var col = 0; col < creatureRow.length; col++) {
                    var n = (col < luckyCreatures? bigN : littleN);
                    for (var j = 0; j < n; j++) {
                        if (foodCol ++ < foodRow.length) {
                            if (!creatureRow[col] || !foodRow[foodCol]) {
                                console.error("Can't access creature or food in row",row,"while assigning food. Creature",col,":",creatureRow[col],"food",foodCol,":",foodRow[foodCol]);
                                return;
                            }
                            creatureRow[col].addTargetFood(foodRow[foodCol]);
                            //console.log("Food",foodCol,"to creature",col);
                        }
                    }
                }
            }
        } else { // complex, alternating way of assigning food. This looks bad, but at least it works for fractional food.
            /* The general idea of assigning food to creatures:
             * In the base case, the food is assigned evenly, so if there are 2 creatures (0, 1) and 4 foods (0 - 3), 0 will eat food 0 and 2, and 1 will eat 1 and 3
             * If the number of food is uneven (like 5 food for 2 creatures), that "extra" food is assigned to the creatures closest to the center so that they can keep walking
             *      while the creatures behind them stop. (We don't want creatures to walk on top of each other.)
             * If the creatures want a fractional amount of food (like 2/3), we figure out how many foods they're going to share. These are the initial foods, so that the creatures
             *      can keep walking to "whole foods" and leave space for other creatures who want to share those foods.
             * If the fractional amount of food is greater than 1/2, then a creature will have to eat bits of multiple shared food to get enough (e.g. if the amount is 2/3,
             *      two creatures eat 2/3 of a food and the last creature has to eat 1/3 of each to make the 2/3. These are called cleanup creatures.
             * Creature should pause to avoid walking into each other, so this system will avoid creatures walking on top of each other EXCEPT when there's no foods
             *      that aren't shared (e.g. each creature wants just 1/2 of a food - then in a 2:1 pen the creatures have to stand in the same place to share the food.
             *      If cases like this are included, we'll have to deal with it somehow.
             */
            var remainder = desiredAmount % 1;

            for (var row = 0; row < foodRows.length; row++) {
                var foodRow = foodRows[row];
                var creatureRow = this.creatureSpots[row];

                if (!foodRow || !creatureRow) continue; // ignore any empty rows
                while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

                var sharedCols = Math.floor(remainder * creatureRow.length); // cols of food that multiple creatures will take a bite of
                var extraCols = (foodRow.length - sharedCols) % creatureRow.length; // cols that aren't evenly divided for the number of creatures
                var cleanupCreatures = creatureRow.length % sharedCols; // number of creatures that don't fall into the normal flow of sharing food

                // To assign the shared cols, we walk through the creatures and try to give them all the right food
                for (var col = 0; col < (sharedCols / remainder); col++) {
                    if (col < cleanupCreatures) {
                        // this creature gets to clean up several uneaten bits of food
                        for (var i = 0; i < (sharedCols / cleanupCreatures); i++) {
                            var index = (i * cleanupCreatures) + col;
                            creatureRow[col].addTargetFood(foodRow[index]);
                        }
                    } else {
                        // no other creatures eat more than one shared food
                        creatureRow[col].addTargetFood(foodRow[(col - cleanupCreatures) % sharedCols], true); // true = we only eat some of the food
                    }
                }

                // assign the rest of the cols, which can be done independently from the shared cols
                for (var col = sharedCols; col < foodRow.length; col++) {
                    var index = (col - sharedCols) % creatureRow.length; // divide up the food among the cols of creatures
                    if (col >= foodRow.length - extraCols) { // assign this food differently since it can't be evenly divided
                        index += creatureRow.length - extraCols; // skip the columns of creatures who don't fit in these extra cols
                    }
                    creatureRow[index].addTargetFood(foodRow[col]); // tell the creature at that index to eat this food
                }

            }
        }
    }

    // Start the creatures eating, staggering them a little by column
    for (var row = 0; row < this.creatureSpots.length; row++) {
        var creatureRow = this.creatureSpots[row];
        if (!creatureRow) continue;

        for (var col = 0; col < creatureRow.length; col++) {
            var creature = creatureRow[col];
            if (!creature) continue; // when there's an uneven number of creatures, the creatures might start at 1 instead of 0
            var time = ((creatureRow.length - col) - Math.random()) * Phaser.Timer.SECOND; // delay the start so that the right col moves first
            this.game.time.events.add(time, creature.state.StartWalkingToFood, creature.state);
        }
    }

    GlassLab.SignalManager.penFeedingStarted.dispatch(this);
};

GlassLab.FeedingPen.prototype.Destroy = function()
{
    for (var col = 0; col < this.getFullWidth(); col++) {
        for (var row = 0; row < this.height; row++) {
            var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
            if (tile)
            {
                tile.setInPen(false);
                tile.unswapType();
            }
        }
    }

    GLOBAL.penManager.RemovePen(this);

    this.onResolved.dispose();
};

GlassLab.FeedingPen.prototype._sortObjectsByGrid = function(fromList, byCol, colOffset) {
    var toList = [];
    colOffset = colOffset || 0;
    var minCol = Number.POSITIVE_INFINITY, minRow = Number.POSITIVE_INFINITY;
    for (var i = 0; i < fromList.length; i++) {
        if (!fromList[i].sprite.visible) continue;
        var row = Math.round(fromList[i].sprite.isoY / GLOBAL.tileSize);
        var col = Math.round(fromList[i].sprite.isoX / GLOBAL.tileSize);
        if (col < minCol) minCol = col;
        if (row < minRow) minRow = row;
    }
    for (var i = 0; i < fromList.length; i++) {
        if (!fromList[i].sprite.visible) continue;
        var row = Math.round(fromList[i].sprite.isoY / GLOBAL.tileSize) - minRow;
        var col = Math.round(fromList[i].sprite.isoX / GLOBAL.tileSize) - minCol;
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

// returns a list of all the spots a creature could enter, formatted like { target: pen, type: "pen", pos: world position}
GlassLab.FeedingPen.prototype.getAvailableSpots = function(creatureType) {
    // if we can't accept this creature type, don't return any spots
    if (creatureType && !this._getCreatureTypeCanEnter(creatureType)) return [];

    // else this creature does want to be here, so figure out its target spots
    var spots = [];
    for (var col = this.widths[0] - 1; col >= 0; col--) { // start with the column closest to the fence
        for (var row = 0; row < this.creatureSpots.length; row++) {
            if (!this.creatureSpots[row][col]) { // nothing's here yet
                var pos = new Phaser.Point( this.sprite.isoX + GLOBAL.tileSize * col, this.sprite.isoY + GLOBAL.tileSize * row );
                spots.push({ pen: this, pos: pos });
            }
        }
        if (spots.length) break; // stop as soon as we found any spots in the row closest to the fence
    }
    return spots;
};

GlassLab.FeedingPen.prototype._getCreatureTypeCanEnter = function(creatureType) {
    // If the number of sections is wrong, it's impossible
    var info = GLOBAL.creatureManager.GetCreatureData(creatureType);

    if (info.desiredFood.length != this.widths.length - 1) return false;

    // Else if we already have a creature of another type, it's impossible
    var currentType = this._getCurrentCreatureType();
    if (currentType && currentType != creatureType) return false;

    // Else if we don't have all the food types the creature wants
    for (var i = 0; i < info.desiredFood.length; i++) {
        if (this.foodTypes.indexOf(info.desiredFood[i].type) == -1) return false;
    }

    return true;
};

GlassLab.FeedingPen.prototype._getCurrentCreatureType = function() {
    // we assume that all creatures in the pen have the same type, so we just need to get one
    for (var i = 0; i < this.creatureSpots.length; i++) {
        for (var j = 0; j < this.creatureSpots[i].length; j++) {
            if (this.creatureSpots[i][j]) return this.creatureSpots[i][j].type;
        }
    }
    return null; // no creatures yet
};

GlassLab.FeedingPen.prototype.canAddCreature = function(creature, tile) {
    // Figure out which row & col of the pen this creature wants to enter
    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
    var col = tile.col - originTile.col;
    var row = tile.row - originTile.row;
    if (row < 0 || this.creatureSpots.length <= row || col < 0 || this.creatureSpots[row].length <= col) return false;
    else if (this.creatureSpots[row][col]) return false;
    else return true;
};

GlassLab.FeedingPen.prototype.tryAddCreature = function(creature, tile) {
    // Figure out which row & col of the pen this creature wants to enter
    var originTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
    var col = tile.col - originTile.col;
    var row = tile.row - originTile.row;
    if (row < 0 || this.creatureSpots.length <= row || col < 0 || this.creatureSpots[row].length <= col) {
        console.error(creature.name,"tried to enter pen space",col,row,"but that's not in the pen!");
        return false;
    }
    if (this.creatureSpots[row][col]) {
        console.error(creature.name,"tried to enter pen space",col,row,"but it's occupied by",this.creatureSpots[row][col].name);
        return false;
    }
    this.creatureSpots[row][col] = creature;
    this.creatureRoot.addChild(creature.sprite);
    creature.pen = this;
    this._repositionCreatures();
    this._onCreatureContentsChanged();
    return true;
};

// tries to remove a creature that has a spot in the pen & unassign its spot
GlassLab.FeedingPen.prototype.tryRemoveCreature = function(creature) {
    var found = false;
    for (var row = 0; row < this.creatureSpots.length; row++) {
        for (var col = 0; col < this.creatureSpots[row].length; col++) {
            if (this.creatureSpots[row][col] == creature) {
                this.creatureSpots[row][col] = null;
                found = true;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        console.error(creature.name,"wanted to leave the pen but it's not in the pen!");
        return false;
    }
    console.log("Found creature to remove. Now spots:",this.creatureSpots);
    this._removeCreature(creature);
    this._onCreatureContentsChanged();
    return true;
};

// removes a creature, assuming that its spot in the pen is already unassigned
GlassLab.FeedingPen.prototype._removeCreature = function(creature, offset) {
    if (offset && !offset.isZero()) {
        creature.sprite.isoX = creature.sprite.isoX - offset.x;
        creature.sprite.isoY = creature.sprite.isoY - offset.y;
    }
    var tile = creature.getTile();
    //console.log("removing creature at",tile.col, tile.row);
    GLOBAL.creatureLayer.addChild(creature.sprite);
    creature.setIsoPos(tile.isoX, tile.isoY); // set the position so it stays on the tile it was over while in the pen
    creature.pen = null;
    if (!(creature.state instanceof GlassLab.CreatureStateDragged)) creature.lookForTargets();
};

GlassLab.FeedingPen.prototype._removeCreaturesInRow = function(row, offset) {
    for (var col = 0; col < row.length; col++) {
        if (row[col]) this._removeCreature(row[col], offset); // remove the creatures in this row from the pen
    }
};

GlassLab.FeedingPen.prototype._repositionCreatures = function() {
  for (var row = 0; row < this.creatureSpots.length; row++) {
      for (var col = 0; col < this.creatureSpots[row].length; col++) {
          if (this.creatureSpots[row][col]) {
              this.creatureSpots[row][col].setIsoPos(col * GLOBAL.tileSize, row * GLOBAL.tileSize);
          }
      }
  }
};

// when the size of the creature section or the number of creatures changes
GlassLab.FeedingPen.prototype._onCreatureContentsChanged = function() {
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
    this._refreshFeedButton();
    GLOBAL.creatureManager.creaturePopulationUpdate();
};

GlassLab.FeedingPen.prototype._refreshFeedButton = function(dontChangeLight) {
    //if (!this.button) return;

    var ok = (this.getNumCreatures() >= this.widths[0] * this.height) &&
        this.foodTypes.length == this.widths.length-1;
    if (ok) { // check that each section has a type of food assigned
        for (var i = 0; i < this.foodTypes.length; i++) {
            if (!GlassLab.FoodTypes[this.foodTypes[i]]) { // this is not a valid kind of food
                ok = false;
                break;
            }
        }
    }
    //this.button.visible = ok;
    this.canFeed = ok;
    if (this.gateLight && !dontChangeLight) {
        if (ok && this.allowFeedButton) {
            if (this.gateLight.spriteName != "gateLightGreen") this.gateLight.loadTexture("gateLightGreen");
            this.gateLight.animations.add('anim');
            this.gateLight.animations.play('anim', 48, true);
        } else {
            this.gateLight.animations.stop(true);
        }
    }
};

GlassLab.FeedingPen.prototype.SetCreatureFinishedEating = function(satisfied) {
    this.unfedCreatures --;
    if (satisfied) this.unsatisfiedCreatures --;
    if (this.unfedCreatures <= 0) {
        var success = this.unsatisfiedCreatures <= 0;
        this.FinishFeeding("satisfied");
    }
};

GlassLab.FeedingPen.prototype.FinishFeeding = function(result) {

    if (this.finished) return;
    this.finished = true;

    var numCreatures = this.height * this.widths[0];
    var win = (result == "satisfied" && (!this.targetNumCreatures || numCreatures >= this.targetNumCreatures));

    // Telemetry
    // TODO: get target creature type
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
    GlassLabSDK.saveTelemEvent("submit_pen_answer", {
        pen_id: this.id,
        pen_dimensions: this.getDimensionEncoding(),
        target_pen_dimensions: this.getTargetDimensionEncoding(),
        foodA_type: this.foodTypes[0],
        foodB_type: this.foodTypes[1] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type,
        target_foodB_type: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].type : ""),
        creature_type: this.creatureType,
        result: result,
        success: win
    });


    if (win)
    {
        GLOBAL.creatureManager.LogNumCreaturesFed(this._getCurrentCreatureType(), this.creatures.length);
        // If this creature is new, Journal.wantToShow will be set to true and the journal will open later
    }
    else
    {
        GlassLab.SignalManager.levelLost.dispatch();
    }

    GlassLab.SignalManager.feedingPenResolved.dispatch(this, win); // currently used in TelemetryManager, FeedAnimalCondition, and OrderFulfillment

    this.onResolved.dispatch(win); // Currently nothing is listening to this signal. It's a red herring.
};

GlassLab.FeedingPen.prototype.tryDropFood = function(foodType, tile) {
    if (this.autoFill || this.feeding) return false;

    var section = this._getSection(tile);
    if (section < 1) return false;

    var prevFoodType = this.foodTypes[section - 1];

    while (this.foodTypes.length < section-1) this.foodTypes.push(null);
    this.foodTypes[section - 1] = foodType;
    this.Resize();
    this._refreshFeedButton();

    GlassLabSDK.saveTelemEvent("set_pen_food", {
        pen_id: this.id,
        previous_food_type: prevFoodType || "",
        new_food_type: foodType,
        food_section: (section == 1? "A" : "B")
    });

    GlassLab.SignalManager.penFoodTypeSet.dispatch(this, foodType, this.foodTypes);

    return true;
};

GlassLab.FeedingPen.prototype.getTargetDimensionEncoding = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
    // We assume a single column of creatures, but currently the encoding uses area so it's not a problem
    return GlassLab.Pen.encodeDimensions(this.targetNumCreatures, 1, creatureInfo.desiredFood[0].amount,
        (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].amount : 0) );
};

GlassLab.FeedingPen.prototype._onLeverPulled = function() {
    GLOBAL.audioManager.playSound("click"); // generic interaction sound

    var leverAnim;

    this._refreshFeedButton();
    if (!this.canFeed || this.feeding) {
        if (this.gateLight.spriteName != "gateLightRed") this.gateLight.loadTexture("gateLightRed");
        this.gateLight.animations.add('anim');
        this.gateLight.animations.play('anim', 48);

        if (this.gateLever.spriteName != "gateSwitchFail") this.gateLever.loadTexture("gateSwitchFail");
        this.gateLever.animations.add('anim');
        leverAnim = this.gateLever.animations.play('anim', 48);
    } else {
        this.gateLight.animations.stop(true);

        if (this.gateLever.spriteName != "gateSwitchFlip") this.gateLever.loadTexture("gateSwitchFlip");
        this.gateLever.animations.add('anim');
        leverAnim = this.gateLever.animations.play('anim', 48);

        var centerPieces = this.centerEdge.pieces.children;
        for (var i = 0; i < centerPieces.length; i++) {
            centerPieces[i].animations.add('anim');
            var anim = centerPieces[i].animations.play('anim', 48);
            /*if (i == 0) { // add an event to the first animation to trigger the feeding once the gate is donw
                anim.onComplete.addOnce(function() {
                    this.game.time.events.add(0, this.FeedCreatures, this); // if we do it immediately it interrupts the update loop
                    }, this);
            }*/
        }
        this.game.time.events.add(100, this.FeedCreatures, this); // using t
    }

    this.gateHoverEffect.visible = false; // can't show this while the animation is playing
    leverAnim.onComplete.addOnce(function() {
        this.gateHoverEffect.visible = true; // show it again when the animation completes
    }, this);
};


GlassLab.FeedingPen.prototype.getNumCreatures = function() {
    var count = 0;
    for (var row = 0; row < this.creatureSpots.length; row++) {
        var creatureRow = this.creatureSpots[row];
        for (var col = 0; col < creatureRow.length; col++) {
            if (creatureRow[col] instanceof GlassLab.Creature) count++
        }
    }
    return count;
};

GlassLab.FeedingPen.prototype.forEachCreature = function(foo, argArray) {
    for (var i = 0; i < this.creatureSpots.length; i++) {
        for (var j = 0; j < this.creatureSpots[i].length; j++) {
            if (this.creatureSpots[i][j]) foo.apply(this.creatureSpots[i][j], argArray);
        }
    }
};