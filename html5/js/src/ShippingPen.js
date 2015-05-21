/**
 * Created by Rose Abernathy on 4/9/2015.
 */
/**
 * Shipping Pen - appears based on the player filling in an order form and then flies off screen
 */
GlassLab.ShippingPen = function(game) {
    this.foodLists = []; // list of food objects, divided by section
    this.creatures = [];
    this.creatureSpots = []; // 2d array of creatures, on per spot in the pen

    this.foodTypes = []; // foodTypes will stay empty until the player adds a kind of food

    GlassLab.Pen.call(this, game, GLOBAL.penLayer);
    this.edgeAnchor = new Phaser.Point(0.075, 0.04);
    this.lidAnchor = new Phaser.Point(0.075, 0.25);
    this.scaleAmount = 0.83; // the old assets are too big for the new tilesize, so scale everything by this amoutn

    this.frontObjectRoot.isoPosition.setTo(GLOBAL.tileSize * -0.6, GLOBAL.tileSize * -0.6);

    this.shadow = this.game.make.isoSprite(GLOBAL.tileSize, GLOBAL.tileSize);
    this.sprite.addChildAt(this.shadow, 0);
    this.shadow.alpha = 0.4;

    this.cornerSprite = this.game.make.isoSprite(GLOBAL.tileSize * -2, GLOBAL.tileSize * -1);
    this.sprite.addChildAt(this.cornerSprite, this.sprite.getChildIndex(this.tileRoot));
    this.cornerSprite.anchor.setTo(this.edgeAnchor.x, this.edgeAnchor.y);
    this.cornerSprite.loadTexture("crate", "crate_back_corner.png");
    this.cornerSprite.scale.setTo(this.scaleAmount, this.scaleAmount);

    this.frontBottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
    this.frontRightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);

    this.lidTopEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.top);
    this.lidLeftEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.left);
    this.lidRightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);
    this.lidBottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);

    this.edges.push(this.frontBottomEdge, this.frontRightEdge, this.lidTopEdge, this.lidLeftEdge, this.lidRightEdge, this.lidBottomEdge);

    this.frontEdgeRoot = this.sprite.addChild( this.game.make.sprite() );
    this.frontEdgeRoot.addChild(this.frontBottomEdge.sprite);
    this.frontEdgeRoot.addChild(this.frontRightEdge.sprite);

    this.lid = this.sprite.addChild( this.game.make.sprite(0, 0) );
    this.lidTileRoot = this.lid.addChild( this.game.make.sprite(0, -GLOBAL.tileSize) );

    this.lidCornerSprite = this.game.make.isoSprite(GLOBAL.tileSize * -2, GLOBAL.tileSize * -1, 0, "crate_lidCorner");
    this.lid.addChild(this.lidCornerSprite);
    this.lidCornerSprite.anchor.setTo(this.lidAnchor.x, this.lidAnchor.y);
    this.lidCornerSprite.scale.setTo(this.scaleAmount, this.scaleAmount);

    this.lid.addChild(this.lidTopEdge.sprite);
    this.lid.addChild(this.lidLeftEdge.sprite);
    this.lid.addChild(this.lidRightEdge.sprite);
    this.lid.addChild(this.lidBottomEdge.sprite);

    this.propellerRoot = this.lid.addChild( this.game.make.sprite(0, -GLOBAL.tileSize) );
    this.unusedPropellers = [];

    for (var i = 0; i < this.edges.length; i++) {
        this.edges[i].presetScale = this.scaleAmount; // this is applied to pieces that are added to the edge
    }

    this.centerEdge.setVisible(false);

    this.SetDraggableOnly(); // no dragging

    this.tooltip = new GlassLab.UIRatioTooltip(this.game, 5, true);
    GLOBAL.UIManager.topAnchor.addChild(this.tooltip);
    this.tooltip.scale.setTo(0.8, 0.8);
    this.tooltip.y = 100;

    // Make distinct roots for the food and creatures so we can tween them as a hint
    this.creatureRoot = this.frontObjectRoot.addChild(this.game.make.sprite());
    this.foodRoot = this.frontObjectRoot.addChild(this.game.make.sprite());

    this.onShipped = new Phaser.Signal();

    this.currentlyShipping = false; // tracks whether we're still shipping or we canceled it
};

GlassLab.ShippingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.ShippingPen.constructor = GlassLab.ShippingPen;


GlassLab.ShippingPen.prototype._onDestroy = function() {
    GlassLab.Pen.prototype._onDestroy.call(this);

    this.currentlyShipping = false; // should prevent further shipping animations from being triggered

    // Clean up the smokepuff anims so we don't have issues with "killOnComplete"
    if (this.smokePuffs) {
        for (var i = 0; i < this.smokePuffs.length; i++) {
            this.smokePuffs.animations.stopAll();
            this.smokePuffs.destroy();
        }
    }

    if (this.smokeRoot) this.smokeRoot.destroy();
};

GlassLab.ShippingPen.prototype.reset = function() {
    this.currentlyShipping = false; // should prevent further shipping animations from being triggered

    // reset to the pre-shipped state
    this.frontEdgeRoot.visible = false;
    this.lid.visible = false;
    this.sprite.alpha = 1;
    this.shadow.alpha = 0.3;
    this.shadow.isoPosition.setTo(GLOBAL.tileSize, GLOBAL.tileSize);
};

GlassLab.ShippingPen.prototype.hide = function() {
    GlassLab.Pen.prototype.hide.apply(this, arguments);
    this.tooltip.hide();

    // Remember that we don't have any dimensions for the next open
    this.prevHeight = 0;
    this.prevWidth = 0;
};

// Adds the specified number of creatures and food
// If hideCreatures or hideFood is true, then all those contents will be hidden except for one row (used for hints)
GlassLab.ShippingPen.prototype.setContents = function(creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, singleCreatureRow, singleFoodRow, totalFoodHint) {
    //console.log("Set contents",creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, singleCreatureRow, singleFoodRow, totalFoodHint);

    // Remember a few things that we need to access later
    this.foodTypes = foodTypes;
    this.creatureType = creatureType;
    this.numFoods = numFoods;
    this.numCreatures = numCreatures;

    this.singleFoodRow = singleFoodRow;
    this.singleCreatureRow = singleCreatureRow;
    this.totalFoodHint = totalFoodHint;

    this.widths = [];

    // First figure out the normal dimensions of the pen. Then afterwards we can constrain it based on singleCreatureRow and singleFoodRow.

    // use the target creature width as set in order fulfillment, unless we have fewer creatures than that
    if (targetCreatureWidth) this.widths[0] = Math.min(targetCreatureWidth, numCreatures);
    else this.widths[0] = numCreatures;

    this.height = Math.ceil(numCreatures / this.widths[0]); // tall enough for all the creatures

    // calculate the width for each food is such that the total food fits into our height
    for (var j = 0; j < numFoods.length; j++) {
        this.widths[j + 1] = Math.ceil(numFoods[j] / this.height);
        if (singleFoodRow) { // if we only want to show a single row of food, then the number of each food is equal to as many are in one row
            this.numFoods[j] = this.widths[j + 1];
        }
    }

    // if we only want to show a single row of creatures and a single row of food, we only have 1 row.
    if (singleCreatureRow && singleFoodRow) this.height = 1;

    // if we only want to show a single row of creatures, the number of creatures is equal to as many are in one row.
    if (singleCreatureRow) this.numCreatures = this.widths[0];

    this.tintRows = (singleCreatureRow || singleFoodRow); // if there's some kind of hint, turn on the alternatingly tinted rows

    // We don't call showNewContents until we're done zooming out
    this.game.time.events.add(500, this.transitionToNewContents, this); // the zoom takes 300 ms, so this should work fine
};

GlassLab.ShippingPen.prototype.transitionToNewContents = function() {
    this.newY = -Math.floor(this.height / 2.0) * GLOBAL.tileManager.tileSize;
    this.newX = -Math.floor(this.getFullWidth() / 2.0) * GLOBAL.tileManager.tileSize;

    // Show smoke puffs to cover whichever dimension of the pen is larger (current or previous)
    var maxWidth = Math.max(this.getFullWidth(), this.prevWidth || 0);
    var maxHeight = Math.max(this.height, this.prevHeight || 0);

    // if prevWidth or prevHeight don't exist, then there is no previous pen to accomodate
    var minX = this.prevWidth? Math.min(this.sprite.isoX, this.newX) : this.newX;
    var minY = this.prevHeight? Math.min(this.sprite.isoY, this.newY) : this.newY;

    if (!this.smokeRoot) {
        this.smokeRoot = this.game.make.isoSprite(minX, minY);
        this.sprite.parent.addChild(this.smokeRoot);
    } else {
        this.smokeRoot.isoPosition.setTo(minX, minY);
    }

    this.smokePuffs = [];
    for (var col = 0; col < maxWidth; col++) {
        for (var row = 0; row < maxHeight; row++) {
            var smoke = this.game.make.isoSprite(col * GLOBAL.tileSize, row * GLOBAL.tileSize, 0, "smokeAnim");
            smoke.anchor.setTo(0.4, 0.75);
            smoke.animations.add("puff", Phaser.Animation.generateFrameNames("smoke_puff_crate_", 259, 285, ".png", 3), 24, false);
            smoke.play("puff", 24, false, true); // killOnComplete is true
            this.smokePuffs.push(smoke);
            this.smokeRoot.addChild(smoke);
        }
    }

    // Remember the dimensions for next time
    this.prevHeight = this.height;
    this.prevWidth = this.getFullWidth();

    // Actually update the pen after a short delay
    this.game.time.events.add(100, this.showNewContents, this);
};

GlassLab.ShippingPen.prototype.showNewContents = function() {
    this.sprite.isoX = this.newX;
    this.sprite.isoY = this.newY;

    this.show(); // make sure the pen is visible, and also call Resize

    // Stop previous tweens
    if (this.foodTween) this.foodTween.stop();
    if (this.creatureTween) this.creatureTween.stop();

    // Tween the parts that are hints
    if (this.singleFoodRow) {
        this.foodRoot.alpha = 0.75;
        this.foodTween = this.game.add.tween(this.foodRoot).to({alpha: 0.25}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    } else {
        this.foodRoot.alpha = 1;
    }

    if (this.singleCreatureRow) {
        this.creatureRoot.alpha = 0.75;
        this.creatureTween = this.game.add.tween(this.creatureRoot).to({alpha: 0.25}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    } else {
        this.creatureRoot.alpha = 1;
    }

    // Fill in the creatures in the pen
    this.FillIn(GlassLab.Creature.bind(null, this.game, this.creatureType, this), this.creatureRoot, this.creatureSpots, this.numCreatures,
            0, this.widths[0], true, this.creatureType);
    this.game.time.events.add(0, this._refreshCreatures, this); // hack to make sure creatures are visible. I don't know why they sometimes don't show up

    // Fill in the food to each section
    var startCol = this.widths[0];
    for (var i = 0, len = this.foodTypes.length; i < len; i++) {
        while (this.foodLists.length <= i) this.foodLists.push([]);
        var maxFood = (this.numFoods)? this.numFoods[i] : null;
        this.FillIn(GlassLab.Food.bind(null, this.game, this.foodTypes[i]), this.foodRoot, this.foodLists[i], maxFood,
            startCol, startCol += this.widths[i+1], false, this.foodTypes[i]);
    }
    // hide any food in other sections that we're not using
    for (var j = this.foodTypes.length, len = this.foodLists.length; j < len; j++) {
        var unusedObjects = Array.prototype.concat.apply([], this.foodLists[j]);
        for (var i = unusedObjects.length-1; i >= 0; i--) {
            if (unusedObjects[i]) unusedObjects[i].visible = false;
        }
    }

    if (this.totalFoodHint) this.tooltip.show(this, "hint");
    else this.tooltip.hide();
};

GlassLab.ShippingPen.prototype.ship = function() {
    this.currentlyShipping = true;

    this.frontEdgeRoot.visible = true;
    this.lid.visible = true;

    // calculate how far up we need to place the lid
    var bottomPoint = new Phaser.Point(this.getFullWidth() * GLOBAL.tileSize, this.height * GLOBAL.tileSize); // the isopos of the bottommost point of the pen
    bottomPoint = this.game.iso.projectXY(bottomPoint);
    var height = bottomPoint.y; // how tall the pen is
    var topOffset = GLOBAL.game.camera.height; // approximation of how far from the top of the visible screen our crate is
    this.offscreenY = -1.25 * (topOffset + height); // move it up enough for the bottom of the pen to be off the top of the screen (with some padding)
    this.lid.y = this.offscreenY;

    this.frontEdgeRoot.alpha = 0;
    this.lid.alpha = 0;

    this.Resize(); // draw the front edges and the lid

    var tween = this.game.add.tween(this.frontEdgeRoot).to({alpha: 1}, 500, Phaser.Easing.Linear.InOut, true, 0);
    tween.onComplete.addOnce(this._dropLid, this);
};

GlassLab.ShippingPen.prototype._dropLid = function() {
    if (!this.currentlyShipping) return; // maybe we canceled in the middle

    this.game.add.tween(this.lid).to({alpha: 1}, 50, Phaser.Easing.Linear.InOut, true, 0); // quickly fade in the lid (if we failed to get it totally offscreen)
    var tween = this.game.add.tween(this.lid).to({y: 0}, 500, Phaser.Easing.Cubic.In, true, 0);
    tween.onComplete.addOnce(function() {
        GLOBAL.audioManager.playSound("roofThudSound");
        this._openPropellers();
    }, this);
};

GlassLab.ShippingPen.prototype._openPropellers = function() {
    if (!this.currentlyShipping) return; // maybe we canceled in the middle

    var closedPropellers = [].concat(this.propellerRoot.children);
    var delay = 500, betweenPropellers = (400 / closedPropellers.length);
    var totalTime = delay + closedPropellers.length * betweenPropellers;
    while (closedPropellers.length) {
        // randomly pick a propeller
        var index = Math.floor(Math.random() * closedPropellers.length);
        var prop = closedPropellers.splice(index, 1)[0]; // splice returns an array
        this.game.time.events.add(delay + closedPropellers.length * betweenPropellers, this._openPropeller, this, prop);
    }

    // play 1 propeller start sound after delay:
    this.game.time.events.add(delay + 420, function() {
        GLOBAL.audioManager.playSound("propellerStartSound");
    }, this);

    // play 1 more prop start sound.....
    this.game.time.events.add(totalTime + 700, function() {
        GLOBAL.audioManager.playSound("propellerStartSound");
    }, this);

    this.game.time.events.add(totalTime + 1000, this._flyAway, this);
};

GlassLab.ShippingPen.prototype._openPropeller = function(prop) {
    var anim = prop.play("extend");
    anim.paused = false;
    anim.onComplete.addOnce(function() {
        this.play("spin");
    }, prop);
};

GlassLab.ShippingPen.prototype._flyAway = function() {
    if (!this.currentlyShipping) return; // maybe we canceled in the middle

    // audio:
    this.game.time.events.add(1000, function() {
        GLOBAL.audioManager.playSound("propellerSpinLoopSound", false, true);
    }, this);

    // begin fading propeller loop after a few seconds:
    this.game.time.events.add(3000, function() {
        GLOBAL.audioManager.fadeSound("propellerSpinLoopSound", 4000, 0); // fade to volume 0 over a few seconds
    }, this);

    var isoDist = this.game.iso.unproject(new Phaser.Point(0, this.offscreenY));
    var spriteTarget = Phaser.Point.add(this.sprite.isoPosition, isoDist);
    var shadowTarget = Phaser.Point.subtract(this.shadow.isoPosition, isoDist);
    shadowTarget.x += this.offscreenY / 2;

    var time = 6000;
    var delay = 500;
    this.game.add.tween(this.sprite).to({isoX: spriteTarget.x, isoY: spriteTarget.y}, time, Phaser.Easing.Quintic.In, true, delay);
    this.game.add.tween(this.shadow).to({isoX: shadowTarget.x, isoY: shadowTarget.y}, time, Phaser.Easing.Quintic.In, true, delay);
    this.game.add.tween(this.shadow).to({alpha: 0}, time * 0.8, Phaser.Easing.Quintic.In, true, delay);

    var tween = this.game.add.tween(this.sprite).to({alpha: 0}, 100, Phaser.Easing.Quadratic.InOut, true, time+delay-100); // fade out at the end in case we're not on screen
    tween.onComplete.addOnce(this._finishShipping, this);
};

GlassLab.ShippingPen.prototype._finishShipping = function() {
    if (!this.currentlyShipping) return; // maybe we canceled in the middle

    console.log("Finished shipping!");
    this.currentlyShipping = false;
    this.onShipped.dispatch();
};

GlassLab.ShippingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);

    if (this.lid.visible) {
        this._drawPropellers();
    }

    // hide all arrows
    for (var i = 0; i < this.edges.length; i++) {
        this.edges[i].showArrow(false);
    }
};

GlassLab.ShippingPen.prototype._drawEdges = function() {
    this._drawVerticalEdge(this.leftEdge, 0, 1, this.height,  "crate", "crate_back_left.png", this.edgeAnchor, -1, -1);
    //this._drawVerticalEdge(this.centerEdge, this.widths[0], 0, this.height, "crate", "crate_front_right.png", this.edgeAnchor, -1, -1);

    this._drawVerticalEdge(this.rightmostEdge, this.getFullWidth(), 0, this.height, "crate", "crate_front_right.png", this.edgeAnchor, -2, -1);

    this._drawHorizontalEdge(this.topEdge, 1, this.getFullWidth(), 0, "crate", "crate_back_right.png", this.edgeAnchor, -2, -1, true);
    this._drawHorizontalEdge(this.bottomEdge, 0, this.getFullWidth(), this.height, "crate", "crate_front_left.png", this.edgeAnchor, -2, -2);

    if (this.frontEdgeRoot.visible) {
        this._drawVerticalEdge(this.frontRightEdge, this.getFullWidth(), 0, this.height, "crate_frontRight", null, this.edgeAnchor, -2, -1);
        this._drawHorizontalEdge(this.frontBottomEdge, 0, this.getFullWidth(), this.height, "crate_frontBottom", null, this.edgeAnchor, -2, -2, true);
    }

    if (this.lid.visible) {
        this._drawHorizontalEdge(this.lidTopEdge, 1, this.getFullWidth(), 0, "crate_lidTop", null, this.lidAnchor, -2, -1);
        this._drawVerticalEdge(this.lidLeftEdge, 0, 1, this.height, "crate_lidLeft", null, this.lidAnchor, -1, -1);
        this._drawVerticalEdge(this.lidRightEdge, this.getFullWidth(), 0, this.height, "crate_lidRight", null, this.lidAnchor, -2, -1);
        this._drawHorizontalEdge(this.lidBottomEdge, 0, this.getFullWidth(), this.height, "crate_lidBottom", null, this.lidAnchor, -2, -2);
    }
};

GlassLab.ShippingPen.prototype._drawBgAtTile = function(col, row, tile) {
    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.tileRoot, "crate", "crate_floor.png", (this.tintRows && row % 2)? 0xeeeeee : 0xffffff, this.scaleAmount);
    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.shadow, "crate_shadow", "", 0x000000, this.scaleAmount);//0.995);
    if (this.lid.visible) this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.lidTileRoot, "crate", "crate_floor.png", 0xffffff, this.scaleAmount);
};

GlassLab.ShippingPen.prototype._drawPropellers = function() {
    this.unusedPropellers.concat(this.propellerRoot.children);
    this.propellerRoot.removeChildren();

    var width = this.getFullWidth();
    var numPropellers = Math.floor(width / 3) + 1;
    var xDist = (width - 1) / (numPropellers - 1); // this is because we always have a propeller on the last space
    var startX = (width == 2)? 0.5 : 0; // width 2 is a special case

    numPropellers = Math.floor(this.height / 3) + 1;
    var yDist = (this.height - 1) / (numPropellers - 1);
    var startY = (this.height == 2)? 0.5 : 0; // height 2 is a special case

    for (var col = startX; col < width; col += xDist) {
        for (var row = startY; row < this.height; row += yDist) {
            // Only add a propeller if we're on the edge
            if (col == startX || col + xDist > width || row == startY || row + yDist > this.height ) {
                this._addPropeller(col, row);
            }
        }
    }

    for (var i = 0; i < this.unusedPropellers.length; i++) {
        this.unusedPropellers[i].visible = false;
    }
};

GlassLab.ShippingPen.prototype._addPropeller = function(col, row) {
    var propeller = this.unusedPropellers.pop();
    if (!propeller) {
        var propeller = this.game.make.isoSprite(col * GLOBAL.tileSize, row * GLOBAL.tileSize, 0, "propellerAnim");
        propeller.anchor.setTo(0.5, 0.92);
        propeller.scale.setTo(this.scaleAmount, this.scaleAmount);
        propeller.animations.add("extend", Phaser.Animation.generateFrameNames("propeller_extender_",060,123,".png",3), 24, false);
        propeller.animations.add("spin", Phaser.Animation.generateFrameNames("propeller_spin_",0,1,".png",3), 24, true);
    }
    propeller.visible = true;
    var anim = propeller.play("extend");
    anim.frame = 0;
    anim.paused = true;
    this.propellerRoot.addChild(propeller);
};

// This is a total hack to fix an issue where creatures don't show up when the pen is first loaded (usually because the order has a hint)
// Maybe something is hiding them again, though I don't know what. Anyway this fixes it.
GlassLab.ShippingPen.prototype._refreshCreatures = function(col, row) {
    for (var i = 0; i < this.creatureSpots.length; i++) {
        for (var j = 0; j < this.creatureSpots[i].length; j++) {
            if (this.creatureSpots[i][j]) this.creatureSpots[i][j].visible = true;
        }
    }
};
