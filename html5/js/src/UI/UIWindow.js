/**
 * Created by Rose Abernathy on 4/17/2015.
 */
var GlassLab = GlassLab || {};

/**
 * UIWindow - base class for the journal, mail, etc.
 */
GlassLab.UIWindow = function(game)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, 20);
    this.open = false;
    this.visible = false;

    this.autoCloseable = true; // whether we can close this window by clicking elsewhere

    this.onFinishedShowing = new Phaser.Signal();
    this.onFinishedHiding = new Phaser.Signal();
};

GlassLab.UIWindow.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIWindow.prototype.constructor = GlassLab.UIWindow;

GlassLab.UIWindow.prototype.toggle = function() {
    if (this.open) this.hide.apply(this, arguments);
    else this.show.apply(this, arguments);
};

GlassLab.UIWindow.prototype.show = function() {
    if (!this.open && this.game) { // tween in
        this.y = this.game.height;
        var tween = this.game.add.tween(this).to({ y: 0 }, 300, Phaser.Easing.Quintic.Out, true);
        tween.onComplete.addOnce(function() { this.onFinishedShowing.dispatch(); }, this);
    } else {
        this.y = 0;
        this.onFinishedShowing.dispatch();
    }
    this.open = true;
    this.visible = true;

    GlassLab.SignalManager.uiWindowOpened.dispatch(this);
};

GlassLab.UIWindow.prototype.hide = function() {
    if (this.open && this.game) { // tween out
        var tween = this.game.add.tween(this).to({ y: this.game.height }, 300, Phaser.Easing.Quintic.Out, true);
        tween.onComplete.addOnce(function() {
            if (!this.open) this.visible = false;
            this.onFinishedHiding.dispatch();
        }, this);
    } else {
        this.visible = false;
        this.onFinishedHiding.dispatch();
    }
    this.open = false;

    GlassLab.SignalManager.uiWindowClosed.dispatch(this);
};