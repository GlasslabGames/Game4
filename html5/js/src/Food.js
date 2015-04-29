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
        unlocked: true,
        cost: -1,
        hidden: false,
        displayNames: {
            singular: "Broccoli",
            plural: "Broccoli"
        }
    },
    strawberry: {
        spriteName: "strawberry",
        spriteOffsetWhileDragging: 7,
        color: 0xef5067,
        unlocked: true,
        cost: -1,
        hidden: false,
        displayNames: {
            singular: "Strawberry",
            plural: "Strawberries"
        }
    },
    meat: {
        spriteName: "meat",
        spriteOffsetWhileDragging: 1,
        color: 0x975f3d, // associated color for the vomit and the hunger bar
        unlocked: false, // Default value, unlock tracked by InventoryManager
        cost: 50,
        hidden: false,
        displayNames: {
            singular: "Meat",
            plural: "Meat"
        }
    },
    tincan: {
        spriteName: "tincan",
        spriteOffsetWhileDragging: -1,
        color: 0x99a2ac,
        unlocked: false,
        cost: 100,
        hidden: false,
        displayNames: {
            singular: "Can",
            plural: "Cans"
        }
    },
    apple: {
        spriteName: "apple",
        spriteOffsetWhileDragging: 15,
        color: 0xc03b30, // associated color for the vomit and the hunger bar
        unlocked: false, // Default value, unlock tracked by InventoryManager
        cost: 20,
        hidden: false,
        displayNames: {
            singular: "Apple",
            plural: "Apples"
        }
    },
    taco: {
        spriteName: "taco",
        spriteOffsetWhileDragging: 0,
        color: 0xf6cf62,
        unlocked: false,
        cost: 200,
        hidden: false,
        displayNames: {
            singular: "Taco",
            plural: "Tacos"
        }
    },
    corn: {
        spriteName: "corn",
        spriteOffsetWhileDragging: -1,
        color: 0x99a2ac,
        unlocked: false,
        cost: 20,
        hidden: false,
        displayNames: {
            singular: "Corn",
            plural: "Corn"
        }
    },
    pizza: {
        spriteName: "pizza",
        spriteOffsetWhileDragging: -4,
        color: 0xe4b76e,
        unlocked: false,
        cost: 200,
        hidden: false,
        displayNames: {
            singular: "Pizza",
            plural: "Pizzas"
        }
    },
    mushroom: {
        spriteName: "mushroom",
        spriteOffsetWhileDragging: 7,
        color: 0xca5d5c,
        unlocked: false,
        cost: 100,
        hidden: false,
        displayNames: {
            singular: "Mushroom",
            plural: "Mushrooms"
        }
    },
    donut: {
        spriteName: "donut",
        spriteOffsetWhileDragging: 3,
        color: 0xf696ed,
        unlocked: false,
        cost: 2000,
        hidden: false,
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
    this._setImage();
    this.canDropInPen = true; // setting on WorldObject
    this.destroyIfOutOfBounds = true; // allow the food to be destroyed if it's dropped somewhere invalid

    this.hoveredPen = null; // track which pen this food is being dragged over
    this.hoveredPenSection = null; // track which section of the pen the food is being dragged over

    this.shadowY = this.shadow.y = -10;
    this.spriteY = this.sprite.y = 5;

    this.health = 1; // food can be partially eaten. health 0 means it's totally eaten.
    this.eaten = false; // set to true as soon as the creature starts eating it
    this.dislikedBy = {}; // creature types are added once they dislike this food

    this.hungerBar = new GlassLab.FillBar(this.game, 60, 25);
    this.hungerBar.sprite.scale.setTo(0.5, 0.5);
    this.hungerBar.sprite.angle = -90;
    this.hungerBar.setAmount(0, 1);
    this.hungerBar.show(false);
    this.hungerBar.sprite.x = 60;
    this.hungerBar.sprite.y = -60;
    this.sprite.addChild(this.hungerBar.sprite);

    this.sprite.events.onDestroy.add(this._onDestroy, this);
};

GlassLab.Food.prototype = Object.create(GlassLab.WorldObject.prototype);
GlassLab.Food.prototype.constructor = GlassLab.Food;

GlassLab.Food.prototype._setImage = function() {
    this.info = GlassLab.FoodTypes[this.type];
    if (!this.info) return; // can't set the image if we don't have a valid type
    this.hasAnimations = false; // this.game.cache.checkImageKey(this.info.spriteName+"_eaten"); // in the future we want to check for anims, but for now we're just using static images since the anims have shadows baked in and other inconsistencies

    var key = (this.hasAnimations)? this.info.spriteName+"_eaten" : this.info.spriteName;
    if (!this.image) {
        this.image = this.game.make.sprite(0, 0, key);
        this.sprite.addChild(this.image);
    }
    else if (this.image.key != key) this.image.loadTexture(key);

    if (this.hasAnimations) this.image.animations.add('anim');
    this.image.scale.x = this.image.scale.y = (this.hasAnimations)? 0.4 : 1.25;
    if (this.hasAnimations) this.image.anchor.setTo(0.4, 1);
    else this.image.anchor.setTo(0.5, 0.7); // this anchor is specific to the carrot, so generify later

    this.shadow.loadTexture(this.info.spriteName+"_shadow");
    this.baseOffsetWhileDragging = -this.info.spriteOffsetWhileDragging || 0;
};

GlassLab.Food.prototype._onDestroy = function() {
    var index = GLOBAL.foodInWorld.indexOf(this);
    if (index > -1) GLOBAL.foodInWorld.splice(index, 1);
};

GlassLab.Food.prototype._onStartDrag = function () {
    GlassLab.WorldObject.prototype._onStartDrag.call(this);
    var index = GLOBAL.foodInWorld.indexOf(this);
    if (index > -1) GLOBAL.foodInWorld.splice(index, 1);
    GLOBAL.hoverLayer.add(this);
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

GlassLab.Food.prototype._onEndDrag = function () {
    GlassLab.WorldObject.prototype._onEndDrag.call(this);
    if (this.destroyed) return; // the world object might have destroyed itself if it was out of bounds

    var tile = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(this.isoX, this.isoY);
    if (this.hoveredPen) this.hoveredPen.showHoveredFood(null, tile);
    if (tile && tile.inPen && tile.inPen.tryDropFood(this.type, tile)) {
        console.log("Dropped food in pen");
        this.destroy();
    } else {
        GLOBAL.foodInWorld.push(this);
        GLOBAL.foodLayer.add(this);
        GlassLab.SignalManager.foodDropped.dispatch(this);
        GlassLab.SignalManager.creatureTargetsChanged.dispatch();
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

GlassLab.Food.prototype.BeEaten = function(amount) {
    amount = Math.min(amount, this.health); // can't eat more than we have left
    this.health -= amount;
    if (this.health > 0.0001) {
        //this.sprite.alpha = this.health; // TODO: show some partially eaten food
        //console.log("- Animating bar to health",this.health);
        this.hungerBar.setAmount(0, this.health, true);
    } else {
        if (this.hungerBar.sprite.visible) this.hungerBar.setAmount(0, 0, true, 0.5);
        if (this.hasAnimations) {
            var anim = this.image.animations.play('anim', 24);
            anim.onComplete.add(this._afterEaten, this);
        } else {
            this._afterEaten(1000);
        }
        this.draggableComponent.active = false;
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
    fadeTime = fadeTime || 3000;
  var tween = this.game.add.tween(this).to( { alpha: 0 }, fadeTime, "Linear", true);
  tween.onComplete.add( function() {this.destroy();}, this);
};

GlassLab.Food.prototype.setType = function(type, showSmoke)
{
    if (type != this.type) {
        this.type = type;
        this._setImage();
    }

    if (showSmoke) {
        if (!this.smoke) {
            this.smoke = this.game.make.sprite(0, 0, "smokeAnim");
            this.addChild(this.smoke);
            this.smoke.anchor.setTo(0.5, 0.75);
            this.smoke.animations.add("puff", Phaser.Animation.generateFrameNames("smoke_puff_food_", 156, 182, ".png", 3), 24, false);
        }
        this.smoke.play("puff");
    }
};

GlassLab.Food.prototype.getTargets = function()
{
    var pos = GlassLab.Util.GetGlobalIsoPosition(this);
    return [
        { food: this, priority: 1, pos: new Phaser.Point(pos.x, pos.y - GLOBAL.tileSize / 3) },
        { food: this, priority: 1, pos: new Phaser.Point(pos.x - GLOBAL.tileSize / 3, pos.y) }
    ];
};