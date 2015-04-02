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

    this.creatureType = creatureType; // note that this is the target creature type (used for telemetry etc), not necessarily the current creature type
    this.foodTypes = []; // foodTypes will stay empty until the player adds a kind of food

    this.autoFill = autoFill; // whether creatures to fill the pen are magically created
    this.allowFeedButton = true;

    GlassLab.Pen.call(this, game, layer, height, widths);

    this.presetCreatureWidth = this.widths[0]; // this is used when filling orders. It's not relevant for normal pens.

    // Instead of adding everything to objectRoot, make parents for the food and creatures so we can order them
    this.foodRoot = this.game.make.isoSprite();
    this.objectRoot.addChild(this.foodRoot);

    this.creatureRoot = this.game.make.group(); // the reason this is a group and not a sprite is so we can use iso.simpleSort
    this.objectRoot.addChild(this.creatureRoot);

    this.SetDraggableOnly(GlassLab.Edge.SIDES.right);

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.onResolved = new Phaser.Signal();

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

    this.refreshContents();

    this._onCreatureContentsChanged();
};

GlassLab.FeedingPen.prototype.refreshContents = function() {
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
    }
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

// Resizes the pen to contain the specified number of creatures and food
GlassLab.FeedingPen.prototype.SetContents = function(creatureType, numCreatures, foodTypes, numFoods, hideCreatures, singleFoodRow) {
    this.SetDraggableOnly(); // don't allow them to adjust the pen

    this.creatureType = creatureType;
    this.foodTypes = foodTypes || [];

    this.numCreatures = numCreatures || 0;
    this.numFoods = numFoods || []; // should be an array
    this.autoFill = true; // if we're setting the number of creatures like this (ie for an order), assume we want to autofill

    this.penStyle = GlassLab.Pen.STYLES.crate;
    // move the creatures to be in front of the topEdge
    this.objectRoot.parent.setChildIndex(this.objectRoot, this.objectRoot.parent.getChildIndex(this.topEdge.sprite));

    this.widths[0] = Math.min(this.presetCreatureWidth, numCreatures); // keep our original creature width as set in order fulfillment, unless we have fewer creatures than that
    this.height = Math.ceil(numCreatures / this.widths[0]);
    for (var j = 0; j < this.numFoods.length; j++) {
        this.widths[j+1] = (singleFoodRow)? this.numFoods[j] : (Math.ceil(this.numFoods[j] / this.height));
        if (j < this.numFoods.length - 1) this.rightEdges[j].sprite.visible = false;
    }
    if (hideCreatures) this.numCreatures = 0; // keep the same widths and height, but don't add any creatures
    this.centerEdge.sprite.visible = false;

    this.sprite.isoY = -Math.floor(this.height / 2.0) * GLOBAL.tileManager.tileSize;
    this.sprite.isoX = -Math.floor(this.getFullWidth() / 2.0) * GLOBAL.tileManager.tileSize;

    this.Resize();
};

GlassLab.FeedingPen.prototype.FillIn = function(boundConstructor, parent, list, maxCount, startCol, endCol, fromRight, targetType) {
    var unusedObjects = Array.prototype.concat.apply([], list); // flatten the 2D list into a new array
    var count = 0;
    list.length = 0; // empty the list. Setting it to [] would break the passed-in reference.

    for (var row = 0; row < this.height; row++) {
        if ((maxCount || maxCount === 0) && count >= maxCount) break;
        list.push([]);
        for (var col = startCol; col < endCol; col ++) {
            if ((maxCount || maxCount === 0) && count >= maxCount) break;
            var obj  = unusedObjects.pop();
            if (!obj) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                if (parent.addChild) parent.addChild(obj.sprite); // if the parent is a sprite
                else parent.add(obj.sprite); // if the parent is a group
            }
            obj.setType(targetType);
            obj.sprite.visible = true;
            obj.sprite.isoX = (fromRight? endCol - col - 1 : col) * GLOBAL.tileSize;
            obj.sprite.isoY = row * GLOBAL.tileSize;
            obj.sprite.parent.setChildIndex(obj.sprite, obj.sprite.parent.children.length - 1); // move it to the back of the children so far
            obj.pen = this;
            list[row].push(obj);
            count++;
        }
    }

    for (var i = unusedObjects.length-1; i >= 0; i--) {
        if (unusedObjects[i]) unusedObjects[i].sprite.visible = false;
        else unusedObjects.splice(i, 1);
    }
};

GlassLab.FeedingPen.prototype._onUpdate = function() {
};

GlassLab.FeedingPen.prototype.FeedCreatures = function() {
    this._refreshFeedButton(true);
    if (!this.autoFill && !this.canFeed) {
        console.error("Tried to feed creatures but ran into discrepancy with number of creatures. Try again.");
        return;
    }

    this.unfedCreatures = this.getNumCreatures();
    this.result = "satisfied"; // this is the default result unless something worse happens
    this.feeding = true;
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
        var remainder = desiredAmount % 1;

        for (var row = 0; row < foodRows.length; row++) {
            var foodRow = foodRows[row];
            var creatureRow = this.creatureSpots[row];

            if (!foodRow || !creatureRow) continue; // ignore any empty rows
            while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

            // If the creatures want fractional amounts of food, then some initial pieces of food are shared.
            var sharedCols = Math.floor(remainder * creatureRow.length + 0.00001); // cols of food that multiple creatures will take a bite of. We add a bit because 0.33333 * 3 was rounding down to 0.
            if (sharedCols) {
                var cleanupCreatures = creatureRow.length % sharedCols; // number of creatures that don't fall into the normal flow of sharing food
                //console.log("remainder:",remainder,"sharedCols:",sharedCols,"cleanupCreatures",cleanupCreatures);

                // To assign the shared cols, we walk through the creatures and try to give them all the right food
                for (var col = 0; col < creatureRow.length; col++) {
                    if (col < cleanupCreatures) {
                        // this creature gets to clean up several uneaten bits of food
                        for (var i = 0; i < (sharedCols / cleanupCreatures); i++) {
                            var index = (i * cleanupCreatures) + col;
                            //console.log("Fractional food",index,"to cleanup creature",col);
                            creatureRow[col].addTargetFood(foodRow[index]);
                        }
                    } else {
                        // no other creatures eat more than one shared food
                        var index = (col - cleanupCreatures) % sharedCols;
                        //console.log("Fractional food",index,"to creature",col);
                        creatureRow[col].addTargetFood(foodRow[index], true); // true = we only eat some of the food
                    }
                }
            }

            // Then we can assign the rest of the food independently from the shared cols.
            var foodCount = foodRow.length - sharedCols; // how many whole pieces of food are left

            // If the food isn't evenly divisible, some lucky creatures get to eat more than others.
            var bigN = Math.ceil(foodCount / creatureRow.length); // number of foods per creature for the lucky creatures
            var littleN = Math.floor(foodCount / creatureRow.length); // number of foods per creature for the unlucky creatures
            var luckyCreatures = foodCount % creatureRow.length;

            // For each creature, assign it the appropriate amount of food (more if it's lucky or less if it's unlucky.)
            var foodCol = sharedCols - 1;
            for (var col = 0; col < creatureRow.length; col++) {
                var n = (col < luckyCreatures? bigN : littleN); // figure out how big a section of food this creature gets
                for (var j = 0; j < n; j++) { // assign each food in this group to the current creature
                    if (foodCol ++ < foodRow.length) {
                        if (!creatureRow[col] || !foodRow[foodCol]) {
                            console.error("Can't access creature or food in row",row,"while assigning food. Creature",col,":",creatureRow[col],"food",foodCol,":",foodRow[foodCol]);
                            return;
                        }
                        creatureRow[col].addTargetFood(foodRow[foodCol]);
                        //console.log("Whole food",foodCol,"to creature",col);
                    }
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
            if (creatureRow[col+1]) creature.creatureInFront = creatureRow[col+1]; // this is used to stop creatures from walking on top of each other
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
    // if we already pulled the lever (or this pen is currently hidden), don't allow any more creatures to enter
    if (this.feeding || !this.sprite.visible) return [];

    // if we can't accept this creature type, don't return any spots
    if (creatureType && !this._getCreatureTypeCanEnter(creatureType)) return [];

    // else this creature does want to be here, so figure out its target spots
    var spots = [];
    for (var col = this.widths[0] - 1; col >= 0; col--) { // start with the column closest to the fence
        for (var row = 0; row < this.creatureSpots.length; row++) {
            if (!this.creatureSpots[row][col]) { // nothing's here yet
                var pos = new Phaser.Point( this.sprite.isoX + GLOBAL.tileSize * col, this.sprite.isoY + GLOBAL.tileSize * row );
                spots.push({ pen: this, pos: pos, priority: 1 });
            }
        }
        if (spots.length) break; // stop as soon as we found any spots in the row closest to the fence
    }

    if (!spots.length) { // there were no open spots, so add occupied spots as a target to go be sad by. All spots will work
        for (var col = this.widths[0] - 1; col >= 0; col--) {
            for (var row = 0; row < this.creatureSpots.length; row++) {
                var pos = new Phaser.Point( this.sprite.isoX + GLOBAL.tileSize * (col-1), this.sprite.isoY + GLOBAL.tileSize * row );
                spots.push({ pen: this, pos: pos, priority: 0.1, full: true }); // full is used to check specifically if the creature should vomit/poop before entering
            }
        }
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
    this.creatureRoot.add(creature.sprite);
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
    if (this.creatureRoot) this.game.iso.simpleSort(this.creatureRoot); // sort the creatures so they don't overlap incorrectly
};

// when the size of the creature section or the number of creatures changes
GlassLab.FeedingPen.prototype._onCreatureContentsChanged = function() {
    GlassLab.SignalManager.creatureTargetsChanged.dispatch(); // TODO: Use different signal
    this._refreshFeedButton();
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

GlassLab.FeedingPen.prototype.SetCreatureFinishedEating = function(result) {
    this.unfedCreatures --;
    if (result != "satisfied") this.result = result; // even if one creature is satisfied, don't let it overwrite the result of other creatures
    if (this.unfedCreatures <= 0) {
        this.FinishFeeding(result);
    }
};

GlassLab.FeedingPen.prototype.FinishFeeding = function(result) {

    if (this.finished) return;
    this.finished = true;

    var numCreatures = this.height * this.widths[0];

    if (!GLOBAL.mailManager.currentOrder) { // don't send telemetry if we're submitting the pen for an order

        // this is used for telemetry, but the actual check is in DoPenChallengeAction
        var creatureType = this._getCurrentCreatureType();
        var telemResult = result;
        if (this.creatureType != creatureType) telemResult = "wrongCreatureType";
        else if (this.targetNumCreatures && numCreatures < this.targetNumCreatures) telemResult = "wrongCreatureNumber";

        var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
        GlassLabSDK.saveTelemEvent("submit_pen_answer", {
            pen_id: this.id,
            pen_dimensions: this.getDimensionEncoding(),
            target_pen_dimensions: this.getTargetDimensionEncoding(),
            foodA_type: this.foodTypes[0],
            foodB_type: this.foodTypes[1] || "",
            target_foodA_type: creatureInfo.desiredFood[0].type,
            target_foodB_type: (creatureInfo.desiredFood[1] ? creatureInfo.desiredFood[1].type : ""),
            creature_type: creatureType,
            target_creature_type: this.creatureType,
            result: telemResult,
            success: (telemResult == "satisfied")
        });
    }

    if (result == "satisfied") GLOBAL.creatureManager.LogNumCreaturesFed(this._getCurrentCreatureType(), this.creatures.length);

    GlassLab.SignalManager.feedingPenResolved.dispatch(this, (result == "satisfied"), numCreatures); // currently used in TelemetryManager, FeedAnimalCondition, and OrderFulfillment

    this.onResolved.dispatch(result, this._getCurrentCreatureType(), numCreatures); // used in DoPenChallengeAction
};

GlassLab.FeedingPen.prototype.tryDropFood = function(foodType, tile) {
    if (this.autoFill || this.feeding) return false;

    var section = this._getSection(tile);
    if (section < 1) return false;

    var prevFoodType = this.foodTypes[section - 1];

    while (this.foodTypes.length < section-1) this.foodTypes.push(null);
    this.foodTypes[section - 1] = foodType;

    this.refreshContents();
    this._refreshFeedButton();

    GlassLabSDK.saveTelemEvent("set_pen_food", {
        pen_id: this.id,
        previous_food_type: prevFoodType || "",
        new_food_type: foodType,
        food_section: (section == 1? "A" : "B")
    });

    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
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
    var leverAnim;

    this._refreshFeedButton();
    if (!this.canFeed || this.feeding) {
        if (this.gateLight.spriteName != "gateLightRed") this.gateLight.loadTexture("gateLightRed");
        this.gateLight.animations.add('anim');
        this.gateLight.animations.play('anim', 48);

        if (this.gateLever.spriteName != "gateSwitchFail") this.gateLever.loadTexture("gateSwitchFail");
        this.gateLever.animations.add('anim');
        leverAnim = this.gateLever.animations.play('anim', 48);

        GLOBAL.audioManager.playSound("clickSound"); // generic interaction sound
    } else {
        this.gateLight.animations.stop(true);

        GLOBAL.audioManager.playSound("gateDropSound"); // generic interaction sound

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