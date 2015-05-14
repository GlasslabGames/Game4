/**
 * Created by Rose on 4/8/2015.
 */
/**
 * Poo, aka "droppings" :/
 */
GlassLab.Poop = function(game, type) {
    GlassLab.WorldObject.prototype.constructor.call(this, game);
    this.draggableComponent.setActive(false); // you can't drag poop

    this.sprite.loadTexture("poopAnim");
    this.sprite.animations.add("idle", Phaser.Animation.generateFrameNames("poo_idle_",24,71,".png",3), 48, true);
    this.sprite.animations.add("explode", Phaser.Animation.generateFrameNames("poo_splode_",0,24,".png",3), 48, false);
    this.sprite.play("idle");

    this.alpha = 0;
    var tween = this.game.add.tween(this).to( { alpha: 1 }, 100, "Linear", true);

    this.input.customHoverCursor = "button";

    this.clicked = false;
    this.events.onInputDown.add(this._onClick, this);

    this.timer = this.game.time.events.add(10000, this._fadeAway, this);
};

GlassLab.Poop.prototype = Object.create(GlassLab.WorldObject.prototype);
GlassLab.Poop.prototype.constructor = GlassLab.Poop;

GlassLab.Poop.prototype._onDestroy = function() {
    if (this.timer) this.game.time.events.remove(this.timer);
};

GlassLab.Poop.prototype._onClick = function() {
    if (!this.clicked) {
        this.clicked = true;
        GLOBAL.audioManager.playSound("poopSplatSound");
        var anim = this.sprite.play("explode");
        if (anim) anim.onComplete.addOnce(function() { this._fadeAway(300); }, this);
        else this._fadeAway();
    }
};
GlassLab.Poop.prototype._fadeAway = function(fadeTime) {
    if (!this.game) return; // already been destroyed
    fadeTime = fadeTime || 1000;
    var tween = this.game.add.tween(this).to( { alpha: 0 }, fadeTime, "Linear", true);
    tween.onComplete.add( this.destroy, this);
};