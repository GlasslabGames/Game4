/**
 * Created by Rose Abernathy on 3/19/2015.
 */
var GlassLab = GlassLab || {};

GlassLab.ThoughtBubble = function(game) {
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.game = game;

    this.bubble = this.game.make.sprite(50, -10, "thoughtBubble");
    this.bubble.anchor.setTo(0.5, 1);
    this.addChild(this.bubble);
    this.bubble.animations.add("wobble");
    this.bubble.animations.play("wobble", 48, true);

    this.tail = this.game.make.sprite(0, 0, "thoughtBubbleStem");
    this.tail.scale.setTo(0.75, 0.75);
    this.tail.anchor.setTo(0.5, 0.5);
    this.addChild(this.tail);

    this.bubbleContents = this.game.make.sprite(0, -80);
    this.bubble.addChild(this.bubbleContents);

    this.foodSprite = this.game.make.sprite(0, 0, "apple");
    this.foodSprite.anchor.setTo(0.5, 0.5);
    this.foodSprite.scale.setTo(0.5, 0.5);
    this.foodSprite.alpha = 0.75;
    this.bubbleContents.addChild(this.foodSprite);

    this.symbolSprite = this.game.make.sprite(0, 0, "redX");
    this.symbolSprite.anchor.setTo(0.5, 0.5);
    this.symbolSprite.scale.setTo(0.75, 0.75);
    this.bubbleContents.addChild(this.symbolSprite);

    this.hide();

    this.events.onDestroy.addOnce(this._onDestroy, this);
};

GlassLab.ThoughtBubble.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.ThoughtBubble.prototype.constructor = GlassLab.ThoughtBubble;

GlassLab.ThoughtBubble.prototype._onDestroy = function() {
    if (this.timer) this.game.time.events.remove(this.timer);
};

GlassLab.ThoughtBubble.prototype.show = function(symbol, food, time, callback, callbackContext) {
    this.visible = true;

    if (typeof time == 'undefined') time = 1000; // default time

    this.symbolSprite.visible = symbol;
    this.foodSprite.visible = food;
    this.foodSprite.alpha = symbol? 0.75 : 1; // if the food is under a symbol, it gets lighter

    // food might be either a spritename or a food type, so check for food type. (This might be redundant if the food type == the spriteName, but it won't hurt)
    if (food in GlassLab.FoodTypes) food = GlassLab.FoodTypes[food].spriteName;

    if (symbol && symbol != this.symbolSprite.key) this.symbolSprite.loadTexture(symbol);
    if (food && food != this.symbolSprite.key) this.foodSprite.loadTexture(food);

    this.tail.scale.setTo(0,0);
    this.bubble.scale.setTo(0,0);
    this.bubbleContents.scale.setTo(0,0);

    this.game.add.tween(this.tail.scale).to( { x: 0.75, y: 0.75}, 100, "Linear", true, 0 );
    this.game.add.tween(this.bubble.scale).to( { x: 1, y: 1}, 150, "Linear", true, 200 );
    this.game.add.tween(this.bubbleContents.scale).to( { x: 1, y: 1}, 150, "Linear", true, 250 );

    if (this.timer) this.hide();
    this.callback = callback;
    this.callbackContext = callbackContext;
    this.timer = this.game.time.events.add(time, this.hide, this);
};

GlassLab.ThoughtBubble.prototype.hide = function() {
    if (!this.game) return; // already removed from the game

    if (this.timer) {
        this.game.time.events.remove(this.timer);
        this.timer = null;
    }
    if (this.callback) {
        this.callback.call(this.callbackContext);
        this.callback = null;
    }
    this.visible = false;
};