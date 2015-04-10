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

    /*this.foodRoot = this.game.make.isoSprite();
    this.frontObjectRoot.addChild(this.foodRoot);

    this.creatureRoot = this.game.make.group();
    this.frontObjectRoot.addChild(this.creatureRoot);*/
    // we can just use frontObjectRoot

    this.SetDraggableOnly(); // no dragging

    this.onResolved = new Phaser.Signal();

    this.sprite.events.onDestroy.add(this.Destroy, this);
};

GlassLab.ShippingPen.prototype = Object.create(GlassLab.Pen.prototype);
GlassLab.ShippingPen.constructor = GlassLab.ShippingPen;

// Adds the specified number of creatures and food
GlassLab.ShippingPen.prototype.SetContents = function(creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, hideCreatures, singleFoodRow) {
    // use the target creature width as set in order fulfillment, unless we have fewer creatures than that
    if (targetCreatureWidth) this.widths[0] = Math.min(this.presetCreatureWidth, numCreatures);
    else this.widths[0] = numCreatures;

    this.height = Math.ceil(numCreatures / this.widths[0]);
    for (var j = 0; j < numFoods.length; j++) {
        this.widths[j+1] = (singleFoodRow)? numFoods[j] : (Math.ceil(numFoods[j] / this.height));
        if (j < numFoods.length - 1) this.rightEdges[j].sprite.visible = false;
    }
    if (hideCreatures) numCreatures = 0; // keep the same widths and height, but don't add any creatures
    this.centerEdge.sprite.visible = false;

    this.sprite.isoY = -Math.floor(this.height / 2.0) * GLOBAL.tileManager.tileSize;
    this.sprite.isoX = -Math.floor(this.getFullWidth() / 2.0) * GLOBAL.tileManager.tileSize;

    this.show(); // make sure the pen is visible, and also call Resize

    // Fill in the creatures in the pen
    this.FillIn(GlassLab.Creature.bind(null, this.game, creatureType, this), this.frontObjectRoot, this.creatureSpots, numCreatures,
        0, this.widths[0], true, creatureType);

    // Fill in the food to each section
    var startCol = this.widths[0];
    for (var i = 0, len = foodTypes.length; i < len; i++) {
        while (this.foodLists.length <= i) this.foodLists.push([]);
        var maxFood = (numFoods)? numFoods[i] : null;
        this.FillIn(GlassLab.Food.bind(null, this.game, foodTypes[i]), this.frontObjectRoot, this.foodLists[i], maxFood,
            startCol, startCol += this.widths[i+1], false, foodTypes[i]);
    }
};