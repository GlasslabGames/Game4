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
        spriteOffsetWhileDragging: 15,
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
        spriteOffsetWhileDragging: 17,
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
        spriteOffsetWhileDragging: 11,
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
        spriteOffsetWhileDragging: 9,
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
        spriteOffsetWhileDragging: 25,
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
        spriteOffsetWhileDragging: 10,
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
        spriteOffsetWhileDragging: 9,
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
        spriteOffsetWhileDragging: 6,
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
        spriteOffsetWhileDragging: 18,
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
        spriteOffsetWhileDragging: 13,
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
    else this.image.anchor.setTo(0.4, 0.7); // this anchor is specific to the carrot, so generify later

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
    GLOBAL.foodInWorld.push(this);
    GLOBAL.foodLayer.add(this);
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

// static function
GlassLab.Food.getName = function(type, plural) {
    var key = (plural? "plural" : "singular");
    return GlassLab.FoodTypes[type].displayNames[key];
};

GlassLab.Food.prototype.placeOnTile = function(tile) {
  this.sprite.isoX = tile.isoX;
  this.sprite.isoY = tile.isoY;
  GLOBAL.foodInWorld.push(this);
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
  var tween = this.game.add.tween(this.image).to( { alpha: 0 }, 3000, "Linear", true);
  tween.onComplete.add( function() {this.sprite.destroy();}, this);
};

GlassLab.Food.prototype.setType = function(type)
{
    if (type == this.type) return;

    this.type = type;
    this._setImage();
};

GlassLab.Food.prototype.getTargets = function()
{
    var pos = GlassLab.Util.GetGlobalIsoPosition(this.sprite);
    return [
        { food: this, priority: 1, pos: new Phaser.Point(pos.x + GLOBAL.tileSize / 3, pos.y - GLOBAL.tileSize / 2) },
        { food: this, priority: 1, pos: new Phaser.Point(pos.x - GLOBAL.tileSize / 3, pos.y) }
    ];
};