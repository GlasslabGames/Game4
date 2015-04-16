/**
 * Created by Rose Abernathy on 4/15/2015.
 */
/**
 * Transition - an overlay that shows a transition animation as we go between levels/contexts
 */
GlassLab.Transition = function (game) {
     Phaser.Sprite.prototype.constructor.call(this, game);

    this.game = game;
    this.bitmapData = game.add.bitmapData(game.width, game.height);
    this.sprite = this.game.make.sprite(0, 0, this.bitmapData);
    this.sprite.anchor.setTo(0.5, 0.5);
    this.addChild(this.sprite);

    this.maxDiameter = Math.sqrt(this.bitmapData.width * this.bitmapData.width + this.bitmapData.height * this.bitmapData.height); // diagonal of the canvas

    this.onMiddle = new Phaser.Signal();
    this.onComplete = new Phaser.Signal();

    this.game.scale.onSizeChange.add(this._resize, this);

    this._refresh(0.5);
};

// Extends sprite
GlassLab.Transition.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.Transition.prototype.constructor = GlassLab.Transition;

GlassLab.Transition.prototype.do = function () {
    this.in(true);
};

GlassLab.Transition.prototype.in = function (thenOut) {
    this.visible = true;
    this._refresh(1);
    var tween = this._transition(1, 0, Phaser.Easing.Quartic.In);
    tween.onComplete.addOnce(function() { this._midTransition(thenOut); }, this);
};

GlassLab.Transition.prototype._transition = function (start, end, easing) {
    var tweenCounter = { percent: start };
    var tween = this.game.add.tween(tweenCounter).to( { percent: end }, 800, easing, true);
    tween.onUpdateCallback(function() {
        this._refresh(tweenCounter.percent);
    }, this);
    return tween;
};

GlassLab.Transition.prototype._midTransition = function (thenOut) {
    this.onMiddle.dispatch();
    this._refresh(0);
    if (thenOut) this.game.time.events.add(1000, this.out, this);
};

GlassLab.Transition.prototype.out = function () {
    this.visible = true;
    this._refresh(0);
    var tween = this._transition(0, 1, Phaser.Easing.Quartic.Out);
    tween.onComplete.addOnce(this._endTransition, this);
};

GlassLab.Transition.prototype._endTransition = function () {
    this.onComplete.dispatch();
    this.visible = false;
    //this.game.time.events.add(1000, this.do, this); // if you uncomment this it loops (for testing)
};

GlassLab.Transition.prototype._refresh = function (percent) {
    this.currentPercent = percent;

    this.bitmapData.ctx.globalCompositeOperation = 'source-over'; // normal mode
    this.bitmapData.fill(0, 0, 0); // fill in with black

    this.bitmapData.ctx.globalCompositeOperation = 'destination-out'; // whatever we draw next will be cut out from the canvas
    this.bitmapData.circle(this.bitmapData.width / 2, this.bitmapData.height / 2, this.maxDiameter * percent / 2);
};

GlassLab.Transition.prototype._resize = function () {
    this.bitmapData.resize(this.game.width, this.game.height);
    this.maxDiameter = Math.sqrt(this.bitmapData.width * this.bitmapData.width + this.bitmapData.height * this.bitmapData.height); // diagonal of the canvas
    this._refresh(this.currentPercent);
};