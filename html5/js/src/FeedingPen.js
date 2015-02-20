/**
 * Created by Rose Abernathy on 2/5/2015.
 */

/**
 * Feeding Pen - holds animals on the left and food on the right
 */
GlassLab.FeedingPen = function(game, layer, creatureType, height, widths, autoFill) {
    this.foodLists = []; // list of food objects, divided by section
    this.creatures = [];
    this.foodByRow = [];
    this.feeding = false;

    this.creatureType = creatureType;
    this.foodTypes = []; // foodTypes will stay empty until the player adds a kind of food

    this.autoFill = autoFill; // whether creatures to fill the pen are magically created
    this.allowFeedButton = true;

    GlassLab.Pen.call(this, game, layer, height, widths);

    this.centerEdge.sprite.parent.removeChild( this.centerEdge.sprite ); // for now don't draw the center
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

    GLOBAL.testPen = this; // for testing

    GLOBAL.penManager.AddPen(this);
};

GlassLab.FeedingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.FeedingPen.constructor = GlassLab.FeedingPen;

GlassLab.FeedingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);

    var startCol = this.widths[0];
    for (var i = 0, len = this.foodTypes.length; i < len; i++) {
        if (!this.foodTypes[i] || !GlassLab.FoodTypes[this.foodTypes[i]]) {
            startCol += this.widths[i+1]; // go to the next section
            continue; // don't fill anything in
        }
        while (this.foodLists.length <= i) this.foodLists.push([]);
        var maxFood = (this.numFoods)? this.numFoods[i] : null;
        var spriteName = GlassLab.FoodTypes[this.foodTypes[i]].spriteName + "_eaten"; // this is a little hacky... maybe Food should have SetSpriteName() instead
        this.FillIn(GlassLab.Food.bind(null, this.game, this.foodTypes[i]), this.foodLists[i], maxFood,
            startCol, startCol += this.widths[i+1], false, spriteName);
    }

    if (this.autoFill) {
        this.FillIn(GlassLab.Creature.bind(null, this.game, this.creatureType, this), this.creatures, this.numCreatures,
            0, this.widths[0], true);
        for (var i = 0; i < this.creatures.length; i++) {
            this.creatures[i].draggable = false;
        }
    } else {
        // For each tile in the creature side, mark that it's open for creatures
        for (var col = 0; col < this.widths[0]; col++) {
            for (var row = 0; row < this.height; row++) {
                var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX + (GLOBAL.tileSize * col), this.sprite.isoY + (GLOBAL.tileSize * row));
                if (tile)
                {
                    tile.setInPen(this, this.creatureType);
                    if (tile.occupant && tile.occupant.pen != tile.inPen) { // there's a creature here that hasn't been set as in the pen, so do that
                        tile.occupant.setIsoPos( tile.isoX, tile.isoY ); // make sure it's in the right place in the pen
                        tile.occupant.enterPen(tile.inPen);
                    }
                }
            }
        }
    }

    // If we've set a specific number of food & creatures, use that instead of the default which was set in Pen
    // But it would be better to rewrite the Pen one to count the number of food / creatures currently in the pen.
    if (this.numFoods && this.numCreatures) {
        this.ratioLabel.text = this.numCreatures;
        for (var i = 0; i < this.numFoods.length; i++) {
            this.ratioLabel.text += " : " + this.numFoods[i];
        }
    }

    this.foodByRow = []; // clear foodByRow so that we know to recalculate it next time we need it

    if (this.prevHeight != this.height || this.prevCreatureWidth != this.widths[0]) {
        GlassLab.SignalManager.creatureTargetsChanged.dispatch();

        // Check for any creatures outside the pen and move them out
        for (var i = 0; i < this.creatures.length; i++) {
            var creature = this.creatures[i];
            var tile = creature.getTile();
            if (!this._containsTile(tile, true)) {
                creature.pen = null;
                creature.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, creature));
                this.creatures.splice(i, 1);
                i --;
            }
        }

        this._onCreatureContentsChanged();
        this.prevHeight = this.height;
        this.prevCreatureWidth = this.widths[0];
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
    }
    this.Resize();
};

GlassLab.FeedingPen.prototype.FillIn = function(boundConstructor, list, maxCount, startCol, endCol, fromRight, targetSpriteName) {
    var unusedObjects = list.slice(); // if we didn't provide a list of unused objects, copy the whole list instead
    var count = 0;

    for (var col = startCol; col < endCol; col ++) {
        for (var row = 0; row < this.height; row++) {
            var obj  = unusedObjects.pop();
            if (!obj) { // we ran out of existing tiles, so make a new one
                obj = new boundConstructor();
                this.objectRoot.addChild(obj.sprite);
                list.push(obj);
            }
            if (targetSpriteName && obj.sprite.spriteName != targetSpriteName) obj.sprite.loadTexture(targetSpriteName);
            obj.sprite.visible = true;
            obj.sprite.isoX = (fromRight? endCol - col - 1 : col) * GLOBAL.tileSize;
            obj.sprite.isoY = row * GLOBAL.tileSize;
            obj.sprite.parent.setChildIndex(obj.sprite, obj.sprite.parent.children.length - 1); // move it to the back of the children so far
            obj.pen = this;
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
    this.unfedCreatures = this.unsatisfiedCreatures = this.creatures.length;
    this.feeding = true;
    this.button.visible = false;
    this.SetDraggableOnly(); // make all edges undraggable
    for (var i = 0; i < this.rightEdges.length - 1; i++) {
        this.rightEdges[i].sprite.parent.removeChild( this.rightEdges[i].sprite ); // hide the middle fences
    }

    var creaturesByRow = this._sortObjectsByGrid(this.creatures, false);

    // For each section of food, calculate which foods should go to which creatures
    for (var i = 0; i < this.foodTypes.length; i++) {
        var foodByRow = this._sortObjectsByGrid(this.foodLists[i], false);
        var desiredAmount = this.creatures[0].desiredAmountsOfFood[this.foodTypes[i]]; // assume that all the creatures in the pen are the same kind as the first one
        var remainder = desiredAmount % 1;

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
        for (var row = 0; row < foodByRow.length; row++) {
            var foodRow = foodByRow[row];
            var creatureRow = creaturesByRow[row];

            if (!foodRow || !creatureRow) continue; // ignore any empty rows
            while (!creatureRow[0]) creatureRow.shift(); // the creatures might be offset b/c they are added from the right instead of the left

            var sharedCols = Math.floor(remainder * creatureRow.length); // cols of food that multiple creatures will take a bite of
            var extraCols = (foodRow.length - sharedCols) % creatureRow.length; // cols that aren't evenly divided for the number of creatures
            var cleanupCreatures = creatureRow.length % sharedCols; // number of creatures that don't fall into the normal flow of sharing food

            // To assign the shared cols, we walk through the creatures and try to give them all the right food
            for (var col = 0; col < (sharedCols / remainder); col++) {
                if (col < cleanupCreatures) {
                    // this creature gets to clean up several uneaten bits of food (they don't need .eatFoodPartially set b/c they will eat everything remaining)
                    for (var i = 0; i < (sharedCols / cleanupCreatures); i++) {
                        var index = (i * cleanupCreatures) + col;
                        creatureRow[col].addTargetFood( foodRow[index] );
                    }
                } else {
                    // no other creatures eat more than one shared food
                    creatureRow[col].addTargetFood( foodRow[ (col - cleanupCreatures) % sharedCols ], true ); // true = we only eat some of the food
                }
            }

            // assign the rest of the cols, which can be done independently from the shared cols
            for (var col = sharedCols; col < foodRow.length; col++) {
                var index = (col - sharedCols) % creatureRow.length; // divide up the food among the cols of creatures
                if (col >= foodRow.length - extraCols) { // assign this food differently since it can't be evenly divided
                    index += creatureRow.length - extraCols; // skip the columns of creatures who don't fit in these extra cols
                }
                creatureRow[ index ].addTargetFood( foodRow[col] ); // tell the creature at that index to eat this food
            }

        }
    }

    // Start the creatures eating, staggering them a little by column // TODO: have creatures pause if there's one in front of them
    for (var row = 0; row < foodByRow.length; row++) {
        var creatureRow = creaturesByRow[row];
        if (!creatureRow) continue;

        for (var col = 0; col < creatureRow.length; col++) {
            var creature = creatureRow[col];
            if (!creature) continue; // when there's an uneven number of creatures, the creatures might start at 1 instead of 0
            var time = ((creatureRow.length - col) - Math.random()) * Phaser.Timer.SECOND; // delay the start so that the right col moves first
            this.game.time.events.add(time, creature.state.StartWalkingToFood, creature.state);
        }
    }
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
                tile.occupant = null;
            }
        }
    }

    GLOBAL.penManager.RemovePen(this);

    this.onResolved.dispose();
};

/* Not used, outdated
GlassLab.FeedingPen.prototype.GetNextFoodInCreatureRow = function(creature) {
    if (!this.foodByRow || !this.foodByRow.length) this.foodByRow = this._sortObjectsByGrid(this.foods);
    var row = Math.round(creature.sprite.isoY / GLOBAL.tileSize);
    return (this.foodByRow[row])? this.foodByRow[row].shift() : null;
};


GlassLab.FeedingPen.prototype.GetNextFoodInRow = function(row) {
    if (!this.foodByRow || !this.foodByRow.length) this.foodByRow = this._sortObjectsByGrid(this.foods);
    return (this.foodByRow[row])? this.foodByRow[row].shift() : null;
};
*/

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

GlassLab.FeedingPen.prototype.onCreatureEntered = function(creature) {
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
    if (this.creatures.indexOf(creature) == -1) this.creatures.push(creature);
    this._onCreatureContentsChanged();
};

GlassLab.FeedingPen.prototype.onCreatureRemoved = function(creature) {
    var index = this.creatures.indexOf(creature);
    if (index > -1) this.creatures.splice(index, 1);
    this._onCreatureContentsChanged();
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

// when the size of the creature section or the number of creatures changes
GlassLab.FeedingPen.prototype._onCreatureContentsChanged = function() {
    this._refreshFeedButton();
};

GlassLab.FeedingPen.prototype._refreshFeedButton = function() {
    if (!this.button) return;

    var ok = this.allowFeedButton && (this.creatures.length >= this.widths[0] * this.height) &&
        this.foodTypes.length == this.widths.length-1;
    if (ok) { // check that each section has a type of food assigned
        for (var i = 0; i < this.foodTypes.length; i++) {
            if (!GlassLab.FoodTypes[this.foodTypes[i]]) { // this is not a valid kind of food
                ok = false;
                break;
            }
        }
    }
    this.button.visible = ok;
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

    if (this.finished) return;
    this.finished = true;

    GlassLab.SignalManager.feedingPenResolved.dispatch(this, win);

    this.onResolved.dispatch(win);

    this.game.time.events.add(Phaser.Timer.SECOND * 2, function() {
        if (win)
        {
            GLOBAL.creatureManager.LogNumCreaturesFed(this.creatureType, this.creatures.length);

            GLOBAL.Journal.Show(this.creatureType);

            GLOBAL.levelManager.CompleteCurrentLevel();
        }
        else
        {
            GlassLab.SignalManager.levelLost.dispatch();
        }
    }, this);
};

GlassLab.FeedingPen.prototype.tryDropFood = function(foodType, tile) {
    if (this.autoFill || this.feeding) return false;

    var section = this._getSection(tile);
    if (section < 1) return false;

    while (this.foodTypes.length < section-1) this.foodTypes.push(null);
    this.foodTypes[section - 1] = foodType;
    this.Resize();
    this._refreshFeedButton();
};
