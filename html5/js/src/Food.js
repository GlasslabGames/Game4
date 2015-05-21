/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

/**
 * FoodType - types of food
 */
GlassLab.FoodTypes = {
    broccoli: {
        spriteName: "broccoli",
        spriteOffsetWhileDragging: 5,
        color: 0x8cb149,
        startUnlocked: true,
        cost: -1,
        available: true,
        displayNames: {
            singular: "Broccoli",
            plural: "Broccoli"
        }
    },
    strawberry: {
        spriteName: "strawberry",
        spriteOffsetWhileDragging: 7,
        color: 0xef5067,
        startUnlocked: true,
        cost: -1,
        available: true,
        displayNames: {
            singular: "Strawberry",
            plural: "Strawberries"
        }
    },
    apple: {
        spriteName: "apple",
        spriteOffsetWhileDragging: 15,
        color: 0xc03b30, // associated color for the vomit and the hunger bar
        cost: 20,
        available: true,
        displayNames: {
            singular: "Apple",
            plural: "Apples"
        }
    },
    meat: {
        spriteName: "meat",
        spriteOffsetWhileDragging: 1,
        color: 0x975f3d, // associated color for the vomit and the hunger bar
        cost: 50,
        available: true,
        displayNames: {
            singular: "Meat",
            plural: "Meat"
        }
    },
    tincan: {
        spriteName: "tincan",
        spriteOffsetWhileDragging: -1,
        color: 0x99a2ac,
        cost: 500,
        available: true,
        displayNames: {
            singular: "Can",
            plural: "Cans"
        }
    },
    corn: {
        spriteName: "corn",
        spriteOffsetWhileDragging: -1,
        color: 0x99a2ac,
        cost: 20,
        available: true,
        displayNames: {
            singular: "Corn",
            plural: "Corn"
        }
    },
    taco: {
        spriteName: "taco",
        spriteOffsetWhileDragging: 0,
        color: 0xf6cf62,
        cost: 500,
        available: true,
        displayNames: {
            singular: "Taco",
            plural: "Tacos"
        }
    },
    pizza: {
        spriteName: "pizza",
        spriteOffsetWhileDragging: -4,
        color: 0xe4b76e,
        cost: 700,
        available: true,
        displayNames: {
            singular: "Pizza",
            plural: "Pizzas"
        }
    },
    mushroom: {
        spriteName: "mushroom",
        spriteOffsetWhileDragging: 7,
        color: 0xca5d5c,
        cost: 2000,
        available: true,
        displayNames: {
            singular: "Mushroom",
            plural: "Mushrooms"
        }
    },
    donut: {
        spriteName: "donut",
        spriteOffsetWhileDragging: 3,
        color: 0xf696ed,
        cost: 2000,
        available: true,
        displayNames: {
            singular: "Donut",
            plural: "Donuts"
        }
    }
};

/**
 * Food
 */
GlassLab.Food = function(game, type) {
    GlassLab.WorldObject.prototype.constructor.call(this, game);

    this.type = type;

    this.image = this.game.make.sprite(0, 0, "foodAnim");
    this.sprite.addChild(this.image);
    this.image.anchor.setTo(0.5, 0.58);
    this.image.scale.x = this.image.scale.y = 1.25;

    // reduce the image hitbox since it was way larger than necessary
    var circle = new Phaser.Circle(0, -10, 50);
    //this.image.addChild(this.game.make.graphics().beginFill(0xffffff, 0.5).drawCircle(circle.x, circle.y, circle.radius));
    this.image.hitArea = circle;

    this._setImage();

    this.canDropInPen = true; // setting on WorldObject
    this.destroyIfOutOfBounds = true; // allow the food to be destroyed if it's dropped somewhere invalid

    this.isHovering = false;
    this.hoveredPen = null; // track which pen this food is being dragged over
    this.hoveredPenSection = null; // track which section of the pen the food is being dragged over

    this.shadowY = this.shadow.y = -10;
    this.spriteY = this.sprite.y = 5;

    this.health = 1; // food can be partially eaten. health 0 means it's totally eaten.
    this.eaten = false; // set to true as soon as the creature starts eating it
    this.dislikedBy = {}; // creature types are added once they dislike this food

    this.eaters = []; // list of creatures that are waiting to eat this food (waiting until they get a full eating group)
    this.prevEaters = []; // list of creatures who were waiting to eat this food but gave up

/*    this.hungerBar = new GlassLab.FillBar(this.game, 60, 25);
    this.hungerBar.sprite.scale.setTo(0.5, 0.5);
    this.hungerBar.sprite.angle = -90;
    this.hungerBar.setAmount(0, 1);
    this.hungerBar.show(false);
    this.hungerBar.sprite.x = 60;
    this.hungerBar.sprite.y = -60;
    this.sprite.addChild(this.hungerBar.sprite);*/

    this.sprite.events.onDestroy.add(this._onDestroy, this);

    this.onEnoughEaters = new Phaser.Signal();
};

GlassLab.Food.prototype = Object.create(GlassLab.WorldObject.prototype);
GlassLab.Food.prototype.constructor = GlassLab.Food;

GlassLab.Food.prototype._setImage = function() {
    this.info = GlassLab.FoodTypes[this.type];
    if (!this.info) return; // can't set the image if we don't have a valid type

    this.shadow.loadTexture(this.info.spriteName+"_shadow");
    this.baseOffsetWhileDragging = -this.info.spriteOffsetWhileDragging || 0;

    // Destroy old animation, if there is one
    if (this.image.animations.currentAnim) this.image.animations.currentAnim.destroy();

    this.image.animations.frameName = this.type+"_idle.png";
};

GlassLab.Food.prototype._onDestroy = function() {
    var index = GLOBAL.foodInWorld.indexOf(this);
    if (index > -1) GLOBAL.foodInWorld.splice(index, 1);
    if (this.onEnoughEaters) this.onEnoughEaters.dispose();
    if (this.smokeTimer) this.game.time.events.remove(this.smokeTimer);
    if (this.fadeTimer) this.game.time.events.remove(this.fadeTimer);
};

GlassLab.Food.prototype._onStartDrag = function () {
    GlassLab.WorldObject.prototype._onStartDrag.call(this);
    this.isHovering = true;
    var index = GLOBAL.foodInWorld.indexOf(this);
    if (index > -1) GLOBAL.foodInWorld.splice(index, 1);
    GLOBAL.hoverLayer.add(this);
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

GlassLab.Food.prototype._onEndDrag = function () {
    GlassLab.WorldObject.prototype._onEndDrag.call(this);
    this.isHovering = false;
    if (this.destroyed) return; // the world object might have destroyed itself if it was out of bounds

    var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.isoX, this.isoY);
    if (this.hoveredPen) this.hoveredPen.showHoveredFood(null, tile);
    if (tile && tile.inPen && tile.inPen.tryDropFood(this.type, tile)) {
        console.log("Dropped food in pen");
        this.destroy();
    } else {
        if (this.isInitialDropAttempt) GlassLabSDK.saveTelemEvent("place_food", {food_type: this.foodType, column: tile.col, row: tile.row});
        this.isInitialDropAttempt = false;

        GLOBAL.foodInWorld.push(this);
        GLOBAL.foodLayer.add(this);

        // clear the prevEaters when it's dropped so everyone will check it out again
        this.prevEaters = [];

        GlassLab.SignalManager.foodDropped.dispatch(this);
        GlassLab.SignalManager.creatureTargetsChanged.dispatch();

        if (this.fadeTimer) this.game.time.events.remove(this.fadeTimer);
        this.fadeTimer = this.game.time.events.add(Phaser.Timer.MINUTE, this._onFadeTimer, this); // if it's not eaten or moved for 2 minutes, it fades away
    }
};

GlassLab.Food.prototype._onDrag = function (mousePos, diff) {
    GlassLab.WorldObject.prototype._onDrag.apply(this, arguments);

    var hoveredPen = null;
    var section = -1;
    var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.isoX, this.isoY);
    if (tile && tile.inPen && tile.inPen.canDropFoodAtTile(tile)) {
        hoveredPen = tile.inPen;
        section = tile.inPen.getSection(tile);
    }

    if (this.hoveredPen != hoveredPen || this.hoveredPenSection != section) { // check for changes in what pen we're over
        if (hoveredPen) hoveredPen.showHoveredFood(this.type, tile);
        else if (this.hoveredPen) this.hoveredPen.showHoveredFood(null, tile); // unhover the pen
        this.hoveredPen = hoveredPen;
        this.hoveredPenSection = section;
    }

    this.draggableComponent.showDropTarget = !this.hoveredPen;
};

// static function
GlassLab.Food.getName = function(type, plural) {
    var key = (plural? "plural" : "singular");
    return GlassLab.FoodTypes[type].displayNames[key];
};

GlassLab.Food.prototype.BeEaten = function(animStyle) {
    var amount = 1 / (this.eaters.length || 1); // split between all eaters
    amount = Math.min(amount, this.health); // can't eat more than we have left
    this.health -= amount;
    if (this.health > 0.0001) {
        //this.hungerBar.setAmount(0, this.health, true); // Now that creatures eat in groups, we no longer need the health bar.
    } else {
        this.health = 0;
        //if (this.hungerBar.sprite.visible) this.hungerBar.setAmount(0, 0, true, 0.5);
        if (animStyle == "long") {
            this.image.animations.add("eat", Phaser.Animation.generateFrameNames(this.type + "_death_long_", 5, 48, ".png", 5), 24, false);
        } else { // assume it's short
            this.image.animations.add("eat", Phaser.Animation.generateFrameNames(this.type + "_death_short_", 14, 28, ".png", 5), 24, false);
        }

        var anim = this.image.animations.play('eat', 24);
        if (anim) {
            anim.onComplete.add(this._afterEaten, this);

            this.game.add.tween(this.shadow).to( { alpha: 0 }, 500, "Linear", true);
        } else {
            this._afterEaten(1000);
        }

        this.draggableComponent.setActive(false);
    }
    return amount; // return the actual amount that was eaten
};

GlassLab.Food.prototype.setAnimStyle = function(style) {
  if (style && this.hasAnimations) {
      if (this.image.key != this.info.spriteName+"_eaten_"+style) {
          this.image.loadTexture(this.info.spriteName+"_eaten_"+style)
          this.image.animations.add('anim');
      }
  }
};

GlassLab.Food.prototype._afterEaten = function(fadeTime) {
    if (this.health) return; // there must be a mistake

    this._fadeAway(fadeTime);
};

GlassLab.Food.prototype._onFadeTimer = function() {
    if (this.eaters.length) { // don't let it fade away if anyone's trying to eat it
        this.fadeTimer = this.game.time.events.add(Phaser.Timer.MINUTE, this._onFadeTimer, this);
    } else {
        this._fadeAway();
    }
};

GlassLab.Food.prototype._fadeAway = function(fadeTime) {
    if (!this.game) return; // already been destroyed

    this.inputEnabled = false; // TODO: I don't think the food is actually getting destroyed. This is just a temp fix.

    fadeTime = fadeTime || 3000;
    this.deathTween = this.game.add.tween(this).to( { alpha: 0 }, fadeTime, "Linear", true);
    this.deathTween.onComplete.add( function() {this.destroy();}, this);

    if (this.fadeTimer) this.game.time.events.remove(this.fadeTimer);
};

GlassLab.Food.prototype.reset = function() {
    if (this.deathTween) this.deathTween.stop();
    this.image.animations.stop();
    this.image.animations.frameName = this.type+"_idle.png";
    this.health = 1;
    this.eaten = false;
    this.draggableComponent.setActive(true);
    for (var i = 0; i < this.eaters.length; i++) {
        this.removeEater(this.eaters[i]);
    }
    this.prevEaters = [];
};

GlassLab.Food.prototype.setType = function(type, showSmoke)
{
    if (type != this.type) {
        this.type = type;
        this._setImage();
    }

    if (this.smokeTimer) this.game.time.events.remove(this.smokeTimer);

    if (showSmoke) {
        if (!this.smoke) {
            this.smoke = this.game.make.sprite(0, 0, "smokeAnim");
            this.addChild(this.smoke);
            this.smoke.anchor.setTo(0.5, 0.75);
            this.smoke.animations.add("puff", Phaser.Animation.generateFrameNames("smoke_puff_food_", 156, 182, ".png", 3), 24, false);
        }
        this.smoke.visible = true;
        this.smoke.play("puff");
        // Since the smoke animations didn't always finish, put in a timer that hides them
        this.smokeTimer = this.game.time.events.add(1000, function() {
            this.smoke.animations.stop();
            this.smoke.visible = false;
        }, this);
    }
};

GlassLab.Food.prototype.getTargets = function()
{
    var pos = GlassLab.Util.GetGlobalIsoPosition(this);
    var offset = GLOBAL.tileSize / 2;
    // Now figure out which spots around this food are free. TODO: Don't run this every time
    // We have a prefered list of points and list which we only use if there are no prefered points left
    var points = [new Phaser.Point(pos.x, pos.y - offset), new Phaser.Point(pos.x - offset, pos.y)]; // top and left
    var points2 = [new Phaser.Point(pos.x, pos.y + offset), new Phaser.Point(pos.x + offset, pos.y)]; // bottom and right

    // For each creature currently eating this food, remove their position from the list of available points
    creatureLoop:
    for (var i = 0; i < this.eaters.length; i++) {
        var eaterPos = this.eaters[i].getGlobalPos();
        for (var j = points.length - 1; j >= 0; j--) {
            var d = Phaser.Point.distance(points[j], eaterPos);
            if (d < offset) {
                points.splice(j, 1); // there's someone in this spot
                continue creatureLoop;
            }
        }
        for (var j = points2.length - 1; j >= 0; j--) {
            var d = Phaser.Point.distance(points2[j], eaterPos);
            if (d < offset) {
                points2.splice(j, 1); // there's someone in this spot
                continue creatureLoop;
            }
        }
    }
    if (!points.length) points = points.concat(points2); // only add the 2nd group of points if there are no points left from the first group
    if (!points.length) points = [new Phaser.Point(pos.x, pos.y - offset), new Phaser.Point(pos.x - offset)]; // in case no spots are left, default to the prefered points

    var priority = 1 + (this.eaters.length * 2); // food that already has creatures waiting to eat it gets a higher priority

    var targets = [];
    for (var i = 0; i < points.length; i++) {
        targets.push({food: this, priority: priority, pos: points[i]});
    }
    return targets;
};

GlassLab.Food.prototype.getIsAttractiveTo = function(creature) {
    if (!this.health && this.eaten) return false;
    else if (this.dislikedBy[creature.type]) return false;
    else if (this.hasEnoughEaters()) return false;
    else if (this.prevEaters.indexOf(creature) > -1) return false;
    else return true;
};


GlassLab.Food.prototype.hasEnoughEaters = function() {
    if (!this.eaters.length) return false;
    // The foods that are eaten in groups are only attractive to one one kind of creature, so we can safely assume that all eaters share this creature type
    var creature = this.eaters[0];
    var info = GLOBAL.creatureManager.GetCreatureData(creature.type);
    var group = (this.type in creature.desiredAmountsOfFood)? (info.eatingGroup || 1) : 1; // only use the eating group if this is a desired food (not a mushroom or whatever)
    return this.eaters.length >= group;
};

GlassLab.Food.prototype.addEater = function(creature)
{
    this.eaters.push(creature);

    if (this.hasEnoughEaters()) {
        this.onEnoughEaters.dispatch(this.eaters.length);
    } else {
        this.prevEaters = []; // clear the list so creatures who waited here before will want to come again
        GlassLab.SignalManager.creatureTargetsChanged.dispatch(); // get the attention of idle creatures who might want to come again
    }
};

GlassLab.Food.prototype.removeEater = function(creature, cancel)
{
    var index = this.eaters.indexOf(creature);
    if (index > -1) this.eaters.splice(index, 1);

    // cancel is true if the creature leaves by force (e.g. dragged away)
    if (!cancel) this.prevEaters.push(creature);
};