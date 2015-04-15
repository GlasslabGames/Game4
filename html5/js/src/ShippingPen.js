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
    this.penStyle = GlassLab.Pen.STYLES.crate;
    this.edgeAnchor = new Phaser.Point(0.075, 0.04);
    this.lidAnchor = new Phaser.Point(0.075, 0.25);

    this.cornerSprite = this.game.make.isoSprite(GLOBAL.tileSize * -2, GLOBAL.tileSize * -1);
    this.sprite.addChildAt(this.cornerSprite, this.sprite.getChildIndex(this.tileRoot));
    this.cornerSprite.anchor.setTo(this.edgeAnchor.x, this.edgeAnchor.y);
    this.cornerSprite.loadTexture("crate", "crate_back_corner.png");

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

    this.lid.addChild(this.lidTopEdge.sprite);
    this.lid.addChild(this.lidLeftEdge.sprite);
    this.lid.addChild(this.lidRightEdge.sprite);
    this.lid.addChild(this.lidBottomEdge.sprite);

    this.propellerRoot = this.lid.addChild( this.game.make.sprite(0, -GLOBAL.tileSize) );
    this.unusedPropellers = [];

    this.SetDraggableOnly(); // no dragging

    this.onShipped = new Phaser.Signal();
};

GlassLab.ShippingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.ShippingPen.constructor = GlassLab.ShippingPen;

GlassLab.ShippingPen.prototype.reset = function() {
    // reset to the pre-shipped state
    this.frontEdgeRoot.visible = false;
    this.lid.visible = false;
    this.sprite.alpha = 1;
    this.shadow.alpha = 0.3;
    this.shadow.isoPosition.setTo(GLOBAL.tileSize + 20, GLOBAL.tileSize);
};

// Adds the specified number of creatures and food
GlassLab.ShippingPen.prototype.setContents = function(creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, hideCreatures, singleFoodRow) {
    console.log("Set contents",creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, hideCreatures, singleFoodRow);

    // use the target creature width as set in order fulfillment, unless we have fewer creatures than that
    if (targetCreatureWidth) this.widths[0] = Math.min(targetCreatureWidth, numCreatures);
    else this.widths[0] = numCreatures;

    console.log(this.widths);

    this.height = Math.ceil(numCreatures / this.widths[0]);

    for (var j = 0; j < numFoods.length; j++) {
        this.widths[j+1] = (singleFoodRow)? numFoods[j] : (Math.ceil(numFoods[j] / this.height));
        if (j < numFoods.length - 1) this.rightEdges[j].sprite.visible = false;
    }
    while (j < this.widths) {
        this.widths.pop();
    }

    if (hideCreatures) numCreatures = 0; // keep the same widths and height, but don't add any creatures
    this.centerEdge.sprite.visible = false;

    this.sprite.isoY = -Math.floor(this.height / 2.0) * GLOBAL.tileManager.tileSize;
    this.sprite.isoX = -Math.floor(this.getFullWidth() / 2.0) * GLOBAL.tileManager.tileSize;

    this.show(); // make sure the pen is visible, and also call Resize

    // Hide all the internal edges except for the rightmose edge
    for (var i = 0; i < this.rightEdges.length; i++) {
        this.rightEdges[i].sprite.visible = (i == this.rightEdges.length - 1);
    }

    // Fill in the creatures in the pen
    this.FillIn(GlassLab.Creature.bind(null, this.game, creatureType, this), this.frontObjectRoot, this.creatureSpots, numCreatures,
        0, this.widths[0], true, creatureType);

    // Fill in the food to each section
    var startCol = this.widths[0];
    for (var i = 0, len = foodTypes.length; i < len; i++) {
        if (!foodTypes[i]) continue;
        while (this.foodLists.length <= i) this.foodLists.push([]);
        var maxFood = (numFoods)? numFoods[i] : null;
        this.FillIn(GlassLab.Food.bind(null, this.game, foodTypes[i]), this.frontObjectRoot, this.foodLists[i], maxFood,
            startCol, startCol += this.widths[i+1], false, foodTypes[i]);
    }
};

GlassLab.ShippingPen.prototype.ship = function() {
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
    this.game.add.tween(this.lid).to({alpha: 1}, 50, Phaser.Easing.Linear.InOut, true, 0); // quickly fade in the lid (if we failed to get it totally offscreen)
    var tween = this.game.add.tween(this.lid).to({y: 0}, 500, Phaser.Easing.Linear.In, true, 0);
    tween.onComplete.addOnce(this._openPropellers, this);
};

GlassLab.ShippingPen.prototype._openPropellers = function() {
    var closedPropellers = [].concat(this.propellerRoot.children);
    var totalTime = closedPropellers.length * 100;
    while (closedPropellers.length) {
        // randomly pick a propeller
        var index = Math.floor(Math.random() * closedPropellers.length);
        var prop = closedPropellers.splice(index, 1)[0]; // splice returns an array
        this.game.time.events.add(closedPropellers.length * 100, this._openPropeller, this, prop);
    }
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
    var isoDist = this.game.iso.unproject(new Phaser.Point(0, this.offscreenY));
    var spriteTarget = Phaser.Point.add(this.sprite.isoPosition, isoDist);
    var shadowTarget = Phaser.Point.subtract(this.shadow.isoPosition, isoDist);
    shadowTarget.x += this.offscreenY / 2;

    var time = 3000;
    var delay = 500;
    this.game.add.tween(this.sprite).to({isoX: spriteTarget.x, isoY: spriteTarget.y}, time, Phaser.Easing.Quadratic.In, true, delay);
    this.game.add.tween(this.shadow).to({isoX: shadowTarget.x, isoY: shadowTarget.y}, time, Phaser.Easing.Quadratic.In, true, delay);
    this.game.add.tween(this.shadow).to({alpha: 0}, time * 0.75, Phaser.Easing.Quadratic.In, true, delay);
    this.game.add.tween(this.sprite).to({alpha: 0}, 100, Phaser.Easing.Quadratic.In, true, time+delay-100); // fade out at the end in case we're not on screen
};

GlassLab.ShippingPen.prototype._finishShipping = function() {
    this.onShipped.dispatch();
};

GlassLab.ShippingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);

    if (this.lid.visible) {
        this._drawPropellers();
    }
};

GlassLab.ShippingPen.prototype._drawEdges = function() {
    var col = 0;
    this._drawVerticalEdge(this.leftEdge, col, 1, this.height,  "crate", "crate_back_left.png", this.edgeAnchor, 0, -1);
    col += this.widths[0];
    this._drawVerticalEdge(this.centerEdge, col, 0, this.height, "crate", "crate_front_right.png", this.edgeAnchor, -1, -1);

    for (var i = 0, len = this.rightEdges.length; i < len; i++) {
        if (this.rightEdges[i].sprite.visible) {
            col += this.widths[i+1];
            this._drawVerticalEdge(this.rightEdges[i], col, 0, this.height, "crate", "crate_front_right.png", this.edgeAnchor, -1, -1);
        }
    };

    this._drawHorizontalEdge(this.topEdge, 1, this.getFullWidth(), 0, "crate", "crate_back_right.png", this.edgeAnchor, -1, 0, true);
    this._drawHorizontalEdge(this.bottomEdge, 0, this.getFullWidth(), this.height, "crate", "crate_front_left.png", this.edgeAnchor, -1, -1);

    if (this.frontEdgeRoot.visible) {
        this._drawVerticalEdge(this.frontRightEdge, this.getFullWidth(), 0, this.height, "crate_frontRight", null, this.edgeAnchor, -1, -1);
        this._drawHorizontalEdge(this.frontBottomEdge, 0, this.getFullWidth(), this.height, "crate_frontBottom", null, this.edgeAnchor, -1, -1, true);
    }

    if (this.lid.visible) {
        this._drawHorizontalEdge(this.lidTopEdge, 1, this.getFullWidth(), 0, "crate_lidTop", null, this.lidAnchor, -1, 0);
        this._drawVerticalEdge(this.lidLeftEdge, 0, 1, this.height, "crate_lidLeft", null, this.lidAnchor, 0, -1);
        this._drawVerticalEdge(this.lidRightEdge, this.getFullWidth(), 0, this.height, "crate_lidRight", null, this.lidAnchor, -1, -1);
        this._drawHorizontalEdge(this.lidBottomEdge, 0, this.getFullWidth(), this.height, "crate_lidBottom", null, this.lidAnchor, -1, -1);
    }
};

GlassLab.ShippingPen.prototype._drawBgAtTile = function(col, row, tile) {
    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.tileRoot, "crate", "crate_floor.png");
    this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.shadow, "crate_shadow", "", 0x000000);
    if (this.lid.visible) this._placeTile(GLOBAL.tileSize * (col-2), GLOBAL.tileSize * (row-1), this.lidTileRoot, "crate", "crate_floor.png");
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
        propeller.animations.add("extend", Phaser.Animation.generateFrameNames("propeller_extender_",060,123,".png",3), 48, false);
        propeller.animations.add("spin", Phaser.Animation.generateFrameNames("propeller_spin_",0,1,".png",3), 48, true);
    }
    propeller.visible = true;
    var anim = propeller.play("extend");
    anim.frame = 0;
    anim.paused = true;
    this.propellerRoot.addChild(propeller);
};