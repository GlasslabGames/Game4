/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

/**
 * FoodType - types of food
 */
GlassLab.FoodTypes = [
    {
        spriteName: "carrot",
        unlocked: true,
        cost: 1,
        hidden: false
    },
    {
        spriteName: "carrot_eaten",
        unlocked: false,
        cost: 5,
        hidden: false
    }
];

/**
 * Food - just a sprite for now
 */
GlassLab.Food = function(game, spriteName) {
    this.sprite = game.make.isoSprite(0,0,0, spriteName+"_eaten");
    this.sprite.animations.add('anim');

    this.sprite.scale.x = this.sprite.scale.y = 0.3;
    this.sprite.scale.x *= -1;
    this.game = game;
    this.sprite.anchor.setTo(0.4, 1); // this anchor is specific to the carrot, so generify later
};

GlassLab.Food.prototype.BeEaten = function() {
    var anim = this.sprite.animations.play('anim', 24);
    anim.onComplete.add(this._afterEaten, this);
};

GlassLab.Food.prototype._afterEaten = function() {
    this.game.add.tween(this.sprite).to( { alpha: 0 }, 3000, "Linear", true);
};

GlassLab.Food.prototype.print = function()
{
    var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
    var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
    return "Food("+col+", "+row+")";
};