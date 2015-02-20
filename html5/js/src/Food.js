/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

/**
 * FoodType - types of food
 */
GlassLab.FoodTypes = {
    carrot: {
        spriteName: "carrot",
        color: 0xe37f54, // associated color for the vomit and the hunger bar
        unlocked: true, // Default value, unlock tracked by InventoryManager
        cost: 1,
        hidden: false
    },
    potato: {
        spriteName: "carrot2",
        color: 0x00aaff,
        unlocked: true,
        cost: 5,
        hidden: false
    },
    carrot3: {
        spriteName: "carrot",
        unlocked: false,
        cost: 25,
        hidden: false
    },
    carrot4: {
        spriteName: "carrot",
        unlocked: false,
        cost: 100,
        hidden: false
    }
};

/**
 * Food - just a sprite for now
 */
GlassLab.Food = function(game, type) {
    this.type = type;
    this.info = GlassLab.FoodTypes[type];
    this.sprite = game.make.isoSprite(0,0,0, this.info.spriteName+"_eaten"); // we start with this animation but don't play it until it gets eaten
    this.sprite.animations.add('anim');

    this.sprite.scale.x = this.sprite.scale.y = 0.3;
    this.sprite.scale.x *= -1;
    this.game = game;
    this.sprite.anchor.setTo(0.4, 1); // this anchor is specific to the carrot, so generify later

    this.health = 1; // food can be partially eaten. health 0 means it's totally eaten.

    this.hungerBar = new GlassLab.FillBar(this.game, 160, 40);
    this.hungerBar.sprite.angle = 90;
    this.hungerBar.setAmount(0, 1);
    this.hungerBar.show(false);
    this.hungerBar.sprite.x = -130;
    this.hungerBar.sprite.y = -150;
    this.sprite.addChild(this.hungerBar.sprite);
};

GlassLab.Food.prototype.placeOnTile = function(tile) {
  this.sprite.isoX = tile.isoX;
  this.sprite.isoY = tile.isoY;
  tile.onFoodAdded(this);
};

GlassLab.Food.prototype.BeEaten = function(amount) {
    amount = Math.min(amount, this.health); // can't eat more than we have left
    this.health -= amount;
    if (this.health > 0) {
        //this.sprite.alpha = this.health; // TODO: show some partially eaten food
        console.log("- Animating bar to health",this.health);
        this.hungerBar.setAmount(0, this.health, true);
    } else {
        if (this.hungerBar.sprite.visible) this.hungerBar.setAmount(0, 0, true, true);
        var anim = this.sprite.animations.play('anim', 24);
        anim.onComplete.add(this._afterEaten, this);
        var tile = this.getTile();
        if (tile) tile.onFoodRemoved(this);
    }
    return amount; // return the actual amount that was eaten
};

GlassLab.Food.prototype.setAnimStyle = function(style) {
  if (style) {
      this.sprite.loadTexture(this.info.spriteName+"_eaten_"+style)
      this.sprite.animations.add('anim');
      if (style == "long") { // hacks b/c the animations aren't in the same place
          this.sprite.anchor.setTo(0.45, 1.2);
      }
  }
};

GlassLab.Food.prototype._afterEaten = function() {
  var tween = this.game.add.tween(this.sprite).to( { alpha: 0 }, 3000, "Linear", true);
  tween.onComplete.add( function() {this.sprite.destroy();}, this);
};

GlassLab.Food.prototype.getGlobalIsoPos = function() {
  var sprite = this.sprite;
  var pos = new Phaser.Point(sprite.isoX, sprite.isoY);
  while (sprite.parent && sprite.parent.isoPosition) {
    sprite = sprite.parent;
    pos.x += sprite.isoX;
    pos.y += sprite.isoY;
  }
  return pos;
};

// These functions should definitely be in a common superclass
GlassLab.Food.prototype.getTile = function() {
  return GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
};

GlassLab.Food.prototype.print = function()
{
    var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
    var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
    return "Food("+col+", "+row+")";
};