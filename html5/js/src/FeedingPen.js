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
    this.newFood = []; // set an index to true to indicate that the food is new and should be animated with a smoke puff

    this.gatePieces = [];

    this.hoveredFoodType = null; // track a single kind of food that's currently hovering over the pen
    this.hoveredFoodSection = -1; // track what section it's hovering over

    this.autoFill = autoFill; // whether creatures to fill the pen are magically created
    this.allowFeedButton = true;

    GlassLab.Pen.call(this, game, layer, height, widths);

    // Some edges need new layers in different places in the heirarchy
    var topBackSprite = this.sprite.addChildAt(this.topEdge.addLayer(), 0); // for the dotted line
    this.sprite.addChildAt(this.bottomEdge.addLayer(), 0); // for the dotted line
    for (var i = 0; i < this.rightEdges.length; i++) {
        this.sprite.addChildAt(this.rightEdges[i].addLayer(), this.sprite.getChildIndex(this.frontObjectRoot));
    }
    this.sprite.addChildAt(this.bottomEdge.addLayer(), 0); // for the dotted line

    // For the gate pieces and their highlights
    var centerIndex = this.sprite.getChildIndex(this.backObjectRoot);
    this.gateHighlightSprite = this.sprite.addChildAt(this.centerEdge.addLayer(), centerIndex + 1);
    this.gateHighlightSprite.alpha = 0;
    this.gateAnimSprite = this.sprite.addChildAt(this.centerEdge.addLayer(), centerIndex + 2);

    this.gateFront = this.game.make.isoSprite(0, 0, 0, "gateBottom");
    this.gateFront.anchor.setTo(0.02, -0.18);
    this.bottomEdge.sprite.addChild(this.gateFront);
    this.bottomEdge.onHighlight.add(function(on) {
        this.gateFront.tint = (on)? 0xeebbff : 0xffffff; // see Edge.js
    }, this);

    this.gateBack = this.game.make.isoSprite(0, 0, 0, "gateTop");
    topBackSprite.addChild(this.gateBack);
    this.gateBack.anchor.setTo(0.01, 0.39);
    this.topEdge.onHighlight.add(function(on) {
        this.gateBack.tint = (on)? 0xeebbff : 0xffffff; // see Edge.js
    }, this);

    this.sprite.setChildIndex(this.tileRoot, this.sprite.getChildIndex(this.centerEdge.sprite));

    this.presetCreatureWidth = this.widths[0]; // this is used when filling orders. It's not relevant for normal pens.

    // Instead of adding everything to objectRoot, make parents for the food and creatures so we can order them
    this.foodRoot = this.game.make.isoSprite();
    this.frontObjectRoot.addChild(this.foodRoot);

    this.sparkles = [];
    this.sparkleRoot = this.game.make.isoSprite();
    this.frontObjectRoot.addChild(this.sparkleRoot);

    this.dots = [];
    this.dotRoot = this.game.make.isoSprite();
    this.sprite.addChildAt(this.dotRoot, 0);

    this.creatureRoot = this.game.make.group(); // the reason this is a group and not a sprite is so we can use iso.simpleSort
    this.backObjectRoot.addChild(this.creatureRoot);

    this.SetDraggableOnly(GlassLab.Edge.SIDES.right);

    this.onResolved = new Phaser.Signal();

    this.id = GLOBAL.penManager.pens.length;
    GLOBAL.penManager.AddPen(this);

    this.sprite.inputEnabled = true;
    this.sprite.events.onInputUp.add(this._onMouseUp, this);
};

GlassLab.FeedingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.FeedingPen.constructor = GlassLab.FeedingPen;

GlassLab.FeedingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);

    this._placeArrows();

    this._updateCreatureSpotsAfterResize();

    this.refreshContents();

    this._onCreatureContentsChanged();
};

GlassLab.FeedingPen.prototype.refreshContents = function() {
    // Fill in the food to each section
    var startCol = this.widths[0];
    for (var i = 0, len = this.widths.length-1; i < len; i++) {
        var foodType = (this.hoveredFoodSection-1 == i) && this.hoveredFoodType; // get the hovered food type only if the section is right
        var alpha = (foodType)? 0.5 : 1; // 25% alpha if we're using hovered food
        if (!foodType) foodType = this.foodTypes[i]; // if there's not a hovered foodType, check our stored food type
        var maxCount = (foodType && GlassLab.FoodTypes[foodType])? null : 0; // either no max count (fully filled in) or 0 (nothing filled in)
        while (this.foodLists.length <= i) this.foodLists.push([]);
        this.FillIn(GlassLab.Food.bind(null, this.game), this.foodRoot, this.foodLists[i], maxCount,
                startCol, startCol += this.widths[i + 1], false, foodType, this.newFood[i], alpha);
        this.newFood[i] = false; // it's no longer new after we've drawn it once
    }

    this._repositionCreatures(); // adjust the creatures if they got moved

    this.FillIn(Phaser.Plugin.Isometric.IsoSprite.bind(null, this.game, 0, 0, 0, "penCreatureSlot"), this.dotRoot, this.dots, null, 0, this.widths[0]);
    this._updateDots();

    this.FillIn(Phaser.Plugin.Isometric.IsoSprite.bind(null, this.game, 0, 0, 0, "penAnims"), this.sparkleRoot, this.sparkles, null, this.widths[0], this.getFullWidth());
    for (var i = 0; i < this.sparkles.length; i++) {
        for (var j = 0; j < this.sparkles[i].length; j++) {
            this.sparkles[i][j].animations.add("sparkle", Phaser.Animation.generateFrameNames("pen_sparkler_",0,47,".png",3), 24, true);
            if (this.canFeed) this.sparkles[i][j].play("sparkle");
            this.sparkles[i][j].visible = this.canFeed;
            this.sparkles[i][j].anchor.setTo(0.5, 0.25);
        }
    }
};

GlassLab.FeedingPen.prototype._updateDots = function() {
    // check if the creature type (we just use the value that was set in the telemetry) wants to enter this pen
    var wantToEnter = this._getCreatureTypeCanEnter(this.creatureType);
    for (var i = 0; i < this.dots.length; i++) {
        for (var j = 0; j < this.dots[i].length; j++) {
            var dot = this.dots[i][j];
            // the dot is only visible when there's not a creature in this spot
            dot.visible = !(this.creatureSpots[i] && this.creatureSpots[i][j]);
            if (!dot.visible) continue;
            else if (wantToEnter) {
                dot.alpha = 0.1;
                if (!dot.tween) {
                    dot.tween = this.game.make.tween(dot).to({alpha: 0.3}, 500, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
                } else dot.tween.resume();
            } else {
                if (dot.tween) dot.tween.pause();
                dot.alpha = 0.15;
            }
            dot.anchor.setTo(0.5, 0);
        }
    }
};

GlassLab.FeedingPen.prototype._updateCreatureSpotsAfterResize = function() {
    var tileDif = GlassLab.Util.POINT2;
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

GlassLab.FeedingPen.prototype.FeedCreatures = function() {
    this.checkPenStatus();
    if (!this.autoFill && !this.canFeed) {
        console.error("Tried to feed creatures but ran into discrepancy with number of creatures. Try again.");
        return;
    }

    this.startedFeedEffects = false; // we're feeding now so we must be done with the sparkle etc

    this.unfedCreatures = this.getNumCreatures();
    this.result = GlassLab.results.satisfied; // this is the default result unless something worse happens
    this.feeding = true;
    this.canFeed = false;

    // make all edges undraggable
    this.previouslyDraggableEdges = []; // we want to remember these in case they reset the pen
    for (var i = 0; i < this.edges.length; i++) {
        if (this.edges[i].draggable) {
            this.previouslyDraggableEdges.push(this.edges[i]);
            this.edges[i].setDraggable(false);
        }
    }

    for (var i = 0; i < this.rightEdges.length; i++) {
        this.rightEdges[i].setVisible(false); // hide the middle fences
    }

    // move the creatures to be in front of the gate
    this.frontObjectRoot.addChild(this.creatureRoot);

    // close the items
    GLOBAL.inventoryMenu.hide(true);

    // Reset creature foods in case anything weird happened before
    this.forEachCreature(GlassLab.Creature.prototype.resetTargetFood);

    var desiredFood = this.creatureSpots[0][0].desiredAmountsOfFood; // we can't feed if all spots aren't filled in with the same type of creature, so this should work
    var info = GLOBAL.creatureManager.GetCreatureData(this.creatureSpots[0][0].type);
    var groupSize = info.eatingGroup || 1;

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

            var numGroups = Math.floor(creatureRow.length / groupSize);
            var grouplessCreatures = creatureRow.length % groupSize;

            // Then we can assign the rest of the food independently from the shared cols.
            var foodCount = foodRow.length; // how many whole pieces of food are left

            // If the food isn't evenly divisible, some lucky creatures get to eat more than others.
            var bigN = Math.ceil(foodCount / numGroups); // number of foods per creature for the lucky creatures
            var littleN = Math.floor(foodCount / numGroups); // number of foods per creature for the unlucky creatures
            var luckyCreatures = foodCount % numGroups;

            // For each creature, assign it the appropriate amount of food (more if it's lucky or less if it's unlucky.)
            var foodCol = -1;
            for (var group = 0; group < numGroups; group++) {
                var foodForGroup = ((numGroups - group) <= luckyCreatures? bigN : littleN); // groups with higher indices are lucky
                for (var j = 0; j < foodForGroup; j++) { // assign each food in this section to the current creature
                    if (foodCol ++ < foodRow.length) {
                        if (!foodRow[foodCol]) {
                            console.error("Can't access food in row",row," at col",foodCol,"while assigning food to group", group);
                            return;
                        }
                        for (var groupIndex = 0; groupIndex < groupSize; groupIndex++) { // for each creature in the group
                            var creatureCol = grouplessCreatures + (group * groupSize) + groupIndex;
                            if (!creatureRow[creatureCol]) {
                                console.error("Can't access creature in row",row," at col",creatureCol,"while assigning food to group", group);
                                return;
                            }
                            creatureRow[creatureCol].addTargetFood(foodRow[foodCol], groupIndex, groupSize); // indicate this creature's position in the group
                        }
                    }
                }
            }
        }
    }

    // Start the creatures eating, staggering them a little by column
    for (var row = 0; row < this.creatureSpots.length; row++) {
        var creatureRow = this.creatureSpots[row];
        if (!creatureRow) continue;
        while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

        var numGroups = Math.floor(creatureRow.length / groupSize);
        var grouplessCreatures = creatureRow.length % groupSize;

        this.feedingTimers = [];
        for (var col = 0; col < creatureRow.length; col++) {
            var creature = creatureRow[col];
            var inGroup = Math.floor((col - grouplessCreatures) / groupSize);
            var time = ((numGroups - inGroup) - Math.random()) * Phaser.Timer.SECOND; // delay the start so that the right col moves first
            if (groupSize == 1 && creatureRow[col+1]) creature.creatureInFront = creatureRow[col+1]; // this is used to stop creatures from walking on top of each other
            this.feedingTimers.push( this.game.time.events.add(time, creature.state.StartWalkingToFood, creature.state) );
        }
    }

    GlassLab.SignalManager.penFeedingStarted.dispatch(this);
};

GlassLab.FeedingPen.prototype._onDestroy = function()
{
    GlassLab.Pen.prototype._onDestroy.call(this);

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

    if (!spots.length) { // there were no open spots, so add occupied spots as a target to go be sad by. Add spots outside the waiting area
        var avoidMiddle = this.leftEdge.draggable; // if the arrows there for dragging, don't let creatures stand on it
        var middle = (this.creatureSpots.length - 1) / 2; // find the middle (where the arrow will be)
        var startRow = 0, endRow = this.height;
        if (avoidMiddle && this.height < 3) { // there's no space so allow the creatures to stand farther out
            startRow --;
            endRow ++;
        }
        for (var row = startRow; row < endRow; row++) {
            if (avoidMiddle && Math.abs(row - middle) < 1) continue; // the middle row(s) are not allowed
            var pos = new Phaser.Point( this.sprite.isoX + GLOBAL.tileSize * -1, this.sprite.isoY + GLOBAL.tileSize * row );
            pos.x += (Math.random() - 0.5) * GLOBAL.tileSize * 0.5; // offset by a up to half a tile
            pos.y += (Math.random() - 0.5) * GLOBAL.tileSize * 0.5;
            spots.push({ pen: this, pos: pos, priority: 0.1, outsidePen: true }); // outside is used to check specifically if the creature should vomit/poop before entering
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
    this.creatureRoot.add(creature);
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
    this._removeCreature(creature);
    this._onCreatureContentsChanged();
    return true;
};

// removes a creature, assuming that its spot in the pen is already unassigned
GlassLab.FeedingPen.prototype._removeCreature = function(creature, offset) {
    if (offset && !offset.isZero()) {
        creature.isoX = creature.isoX - offset.x;
        creature.isoY = creature.isoY - offset.y;
    }
    var tile = creature.getTile();
    GLOBAL.creatureLayer.addChild(creature);
    GLOBAL.renderManager.UpdateIsoObjectSort(creature);
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
              this.creatureSpots[row][col].placeOnTile(col, row);
          }
      }
  }
    if (this.creatureRoot) this.game.iso.simpleSort(this.creatureRoot); // sort the creatures so they don't overlap incorrectly
};

// when the size of the creature section or the number of creatures changes
GlassLab.FeedingPen.prototype._onCreatureContentsChanged = function() {
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
    this._updateDots();
    this.checkPenStatus();
};

GlassLab.FeedingPen.prototype.checkPenStatus = function() {
    if (this.feeding) return (this.canFeed = false); // intentional assignment

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

    if (!this.canFeed && ok) GlassLab.SignalManager.penReady.dispatch(this); // when we become ready
    if (this.canFeed != ok) this._setReadyToFeedEffects(ok);
    this.canFeed = ok;
    return ok;
};

GlassLab.FeedingPen.prototype._setReadyToFeedEffects = function(ready) {
    for (var i = 0; i < this.sparkles.length; i++) {
        for (var j = 0; j < this.sparkles[i].length; j++) {
            this.sparkles[i][j].visible = ready;
            if (ready) this.sparkles[i][j].play("sparkle");
        }
    }
};

GlassLab.FeedingPen.prototype.setGateHighlight = function(on) {
    if (on && this.gateHighlightSprite.alpha < 1) {
        this.game.add.tween(this.gateHighlightSprite).to({alpha: 1}, 150, Phaser.Easing.Quadratic.InOut, true);
    } else if (!on && this.gateHighlightSprite.alpha > 0) {
        this.game.add.tween(this.gateHighlightSprite).to({alpha: 0}, 150, Phaser.Easing.Quadratic.InOut, true);
    }

};

GlassLab.FeedingPen.prototype._startFeedEffects = function() {
    this.startedFeedEffects = true;
    //this.gateHighlightSprite.visible = false;
    this.setGateHighlight(false);

    for (var i = 0; i < this.sparkles.length; i++) {
        for (var j = 0; j < this.sparkles[i].length; j++) {
            this.sparkles[i][j].visible = false;
        }
    }

    for (var i = 0; i < this.gatePieces.length; i++) {
        this.gatePieces[i].play("down");
        if (i == 0) this.gatePieces[i].events.onAnimationComplete.addOnce(this.FeedCreatures, this);
    }
};

// Completely reset the creatures and food in the pen to a pre-fed state
GlassLab.FeedingPen.prototype.reset = function() {
    this.feeding = this.finished = false;

    this.forEachCreature(function() { this.StateTransitionTo(new GlassLab.CreatureStateWaitingInPen(this.game, this)); });
    this.forEachCreature(GlassLab.Creature.prototype.resetFoodEaten);
    this.forEachCreature(GlassLab.Creature.prototype.HideHungerBar);

    // reenable draggable edge
    if (this.previouslyDraggableEdges) {
        for (var i = 0; i < this.previouslyDraggableEdges.length; i++) {
            this.previouslyDraggableEdges[i].setDraggable(true);
        }
    }

    // stop all timers that are waiting to make creatures start eating
    if (this.feedingTimers) {
        for (var i = 0; i < this.feedingTimers.length; i++) {
            this.game.time.events.remove(this.feedingTimers[i]);
        }
    }

    // move the creatures to be in behind the gate
    this.backObjectRoot.addChild(this.creatureRoot);

    // close the gate
    for (var i = 0; i < this.gatePieces.length; i++) {
        this.gatePieces[i].animations.frame = 0;
    }

    this.Resize();
};

GlassLab.FeedingPen.prototype.SetCreatureFinishedEating = function(result) {
    this.unfedCreatures --;
    if (result != GlassLab.results.satisfied) this.result = result; // even if one creature is satisfied, don't let it overwrite the result of other creatures
    if (this.unfedCreatures <= 0) {
        this.FinishFeeding(this.result);
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
        if (this.creatureType != creatureType) telemResult = GlassLab.results.wrongCreatureType;
        else if (this.targetNumCreatures && numCreatures < this.targetNumCreatures) telemResult = GlassLab.results.wrongCreatureNumber;

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
            success: (telemResult == GlassLab.results.satisfied)
        });
    }

    if (result == GlassLab.results.satisfied) GLOBAL.creatureManager.LogNumCreaturesFed(this._getCurrentCreatureType(), this.creatures.length);

    GlassLab.SignalManager.feedingPenResolved.dispatch(this, (result == GlassLab.results.satisfied), numCreatures); // currently used in TelemetryManager, FeedAnimalCondition, and OrderFulfillment

    this.onResolved.dispatch(result, this._getCurrentCreatureType(), numCreatures); // used in DoPenChallengeAction
};


GlassLab.FeedingPen.prototype.canDropFoodAtTile = function(tile) {
    if (this.autoFill || this.feeding) return false;

    return this.getSection(tile) > 0;
};

GlassLab.FeedingPen.prototype.showHoveredFood = function(foodType, tile) {
    var section = this.getSection(tile);
    var changed = (this.hoveredFoodType != foodType || this.hoveredFoodSection != section);

    this.hoveredFoodType = foodType;
    this.hoveredFoodSection = section;

    if (changed) this.refreshContents();
};

GlassLab.FeedingPen.prototype.tryDropFood = function(foodType, tile) {
    if (!this.canDropFoodAtTile(tile)) return false;

    var section = this.getSection(tile);
    var prevFoodType = this.foodTypes[section - 1];

    while (this.foodTypes.length < section-1) this.foodTypes.push(null);
    this.foodTypes[section - 1] = foodType;
    this.newFood[section - 1] = true;

    this.refreshContents();
    this.checkPenStatus();

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

GlassLab.FeedingPen.prototype._onMouseUp = function() {
    if (this.startedFeedEffects) return; // don't accept clicks while the gate is dropping
    else if (this.checkPenStatus() || (this.feeding && !this.finished))
    {
        var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX,this.game.input.activePointer.worldY);
        this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
        var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        var section = this.getSection(tile);
        if (section > 0)
        {
            if (this.feeding && !this.finished)
            {
                this.reset();
            }
            else
            {
                this._startFeedEffects();
            }
        }
    }
};

GlassLab.FeedingPen.prototype._drawEdges = function() {
    // The positioning of each piece (by row and col) might seem a little random. In some cases it would have made more sense to use a different anchor point to keep a "truer" row/col... but this is how it is now and it's not worth changing.
    this.gateBack.isoPosition.setTo(GLOBAL.tileSize * (this.widths[0] - 1), 0);
    this.gateFront.isoPosition.setTo(GLOBAL.tileSize * (this.widths[0] - 2), GLOBAL.tileSize * this.height);

    var col = 0;
    this._drawVerticalEdge(this.leftEdge, col, 0, this.height, "dottedLine", null, GlassLab.Util.POINT2.setTo(0.03, 0.24), 1, 0, true);
    col += this.widths[0];
    this._drawVerticalEdge(this.centerEdge, col, 0, this.height, "gateBase", null, GlassLab.Util.POINT2.setTo(0.01, 0.32), 0, 1);
    this._drawVerticalEdge(this.centerEdge, col, 0, this.height, "gateHighlight", null, GlassLab.Util.POINT2.setTo(0.01, 0.53), 0, 1, false, 1);

    this.gatePieces = [];
    for (var row = 0; row < this.height; row++) {
        var anim = this.centerEdge.PlacePiece(col - 2, row, "penAnims", "gate_drop_000.png", GlassLab.Util.POINT2.setTo(0.01, 0.12), false, 2);
        anim.animations.add("down", Phaser.Animation.generateFrameNames("gate_drop_",0,14,".png",3), 24, false);
        anim.animations.add("up", Phaser.Animation.generateFrameNames("gate_raise_",0,14,".png",3), 24, false);
        this.gatePieces.push(anim);
    }

    for (var i = 0, len = this.rightEdges.length; i < len; i++) {
        col += this.widths[i+1];
        if (this.rightEdges[i].sprite.visible) {
            this._drawVerticalEdge(this.rightEdges[i], col, 0, this.height, "dottedLineShadow", null, GlassLab.Util.POINT2.setTo(0.04, 0.20), 0, 1, false, 1);
        }
    };
    this._drawVerticalEdge(this.rightmostEdge, this.getFullWidth(), 0, this.height, "fenceRight", null, GlassLab.Util.POINT2.setTo(0.02, 0.29), 0, 1);

    // dotted lines
    this._drawHorizontalEdge(this.topEdge, 0, this.widths[0], 0, "dottedLine", null, GlassLab.Util.POINT2.setTo(0.03, 0.23), 0, 0, false, 1);
    this._drawHorizontalEdge(this.bottomEdge, 0, this.widths[0], this.height, "dottedLine", null, GlassLab.Util.POINT2.setTo(0.03, 0.23), 0, 0, false, 1);


    // top and bottom fences
    this._drawHorizontalEdge(this.topEdge, this.widths[0]+1, this.getFullWidth(), 0, "fenceTop", null, GlassLab.Util.POINT2.setTo(0.48, 0.19));
    this._drawHorizontalEdge(this.bottomEdge, this.widths[0]+1, this.getFullWidth(), this.height, "fenceBottom", null, GlassLab.Util.POINT2.setTo(0.02, 0.29));

    // end of the top and bottom fence
    this.topEdge.PlacePiece(this.widths[0], 0, "fenceTopCorner", null, GlassLab.Util.POINT2.setTo(0.48, 0.19));
    this.bottomEdge.PlacePiece(this.widths[0], this.height, "fenceBottomCorner", null, GlassLab.Util.POINT2.setTo(0.02, 0.29));
};

GlassLab.FeedingPen.prototype._drawBgAtTile = function(col, row, tile) {
    if (col >= this.widths[0]) {
        this._placeTile(GLOBAL.tileSize * (col - 1), GLOBAL.tileSize * row, this.tileRoot, "penFloor", null, 0xffffff, 1, GlassLab.Util.POINT2.setTo(0, -0.46));
    }
};