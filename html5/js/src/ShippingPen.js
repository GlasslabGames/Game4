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

    this.frontBottomEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.bottom);
    this.frontRightEdge = new GlassLab.Edge(this, GlassLab.Edge.SIDES.right);
    this.edges.push(this.frontBottomEdge, this.frontRightEdge);
    this.sprite.addChild(this.frontBottomEdge.sprite);
    this.sprite.addChild(this.frontRightEdge.sprite);

    this.SetDraggableOnly(); // no dragging

    this.onResolved = new Phaser.Signal();
};

GlassLab.ShippingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.ShippingPen.constructor = GlassLab.ShippingPen;

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

    console.log(this);
};

GlassLab.ShippingPen.prototype.Resize = function() {
    GlassLab.Pen.prototype.Resize.call(this);
    if (this.frontRightEdge) this._drawVerticalEdge(this.frontRightEdge, this.getFullWidth(), 0, this.height, null, "crate_frontRight");
    if (this.frontBottomEdge) this._drawHorizontalEdge(this.frontBottomEdge, 0, this.getFullWidth(), this.height, null, "crate_frontBottom", true);
};