/**
 * Created by Rose Abernathy on 5/5/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DeliverPenAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
};

GlassLab.DeliverPenAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.DeliverPenAction.prototype.constructor = GlassLab.DeliverPenAction;

GlassLab.DeliverPenAction.prototype.Do = function()
{
    this.pen = GLOBAL.penManager.pens[0];
    if (!this.pen) {
        console.error("There's no pen to deliver!");
        this._complete();
    }

    this.crateRoot = this.game.make.isoSprite(this.pen.sprite.isoX - GLOBAL.tileSize * 1.6, this.pen.sprite.isoY - GLOBAL.tileSize * 0.8);
    GLOBAL.effectLayer.addChild(this.crateRoot);

    this.shadow = this.crateRoot.addChild( this.game.make.isoSprite(0, 0, 0, "penDeliveryShadow") );
    this.crate = this.crateRoot.addChild( this.game.make.sprite(0, 0, "penDeliveryCrate") );

    this.propeller = this.crate.addChild( this.game.make.sprite(145, 110, "propellerAnim") );
    this.propeller.anchor.setTo(0.5, 1);
    this.propeller.animations.add("close", Phaser.Animation.generateFrameNames("propeller_extender_",123,060,".png",3), 24, false);
    this.propeller.animations.add("spin", Phaser.Animation.generateFrameNames("propeller_spin_",0,1,".png",3), 24, true);
    this.propeller.play("spin");

    // audio:
    GLOBAL.audioManager.playSoundWithVolumeAndOffset("propellerSpinLoopSound", 0.1, 0.0, true); // start propeller loop quiet
    GLOBAL.audioManager.fadeSound("propellerSpinLoopSound", 2000, 1.0); // fade in loop to volume 1.0 over 2 seconds.

    this.highlight = this.crate.addChild( this.game.make.sprite(0, 0, "penDeliveryHighlight") );
    this.highlight.alpha = 0;

    this.pen.sprite.alpha = 0;
    this.pen.tooltipDisabled = true;

    this.crate.y = -GLOBAL.game.camera.height - this.crate.height; // move it up enough for the bottom of the crate to be off the top of the screen
    this.crate.alpha = 0;
    this.shadow.isoX = -GLOBAL.tileSize * 3;
    this.shadow.alpha = 0;

    var time = 4000;
    this.game.add.tween(this.crate).to({alpha: 1}, 100, Phaser.Easing.Quadratic.InOut, true); // fade in first in case we're on screen
    var easing = Phaser.Easing.Quintic.Out;
    this.game.add.tween(this.crate).to({y: 0}, time, easing, true, 100);
    this.game.add.tween(this.shadow).to({isoX: 0}, time, easing, true, 100);
    this.game.add.tween(this.shadow).to({alpha: 1}, time, easing, true, 100);
    this.landTimer = this.game.time.events.add(time - 1000, this._penLanded, this);
};

GlassLab.DeliverPenAction.prototype._penLanded = function() {
    // audio:
    GLOBAL.audioManager.fadeSound("propellerSpinLoopSound", 100, 0); // fade loop to volume 0 quickly, then stop.
    GLOBAL.audioManager.playSound("propellerStartSound"); // makes for a good wind-down sound too
    this.game.time.events.add(700, function() {
        GLOBAL.audioManager.fadeSound("propellerStartSound", 300, 0); // cut off the end of the start sound for better effect.
    }, this);

    this.propeller.play("close");
    this.propeller.events.onAnimationComplete.addOnce(this._propellerClosed, this);
};

GlassLab.DeliverPenAction.prototype._propellerClosed = function() {
    this.highlightTween = this.game.add.tween(this.highlight).to({alpha: 0.3}, 500, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);
    GlassLab.SignalManager.tutorialAdvanced.dispatch();
    this.crate.inputEnabled = true;
    this.crate.input.priorityID = GLOBAL.UIpriorityID - 1; // highest priority, not counting the UI
    this.crate.input.customHoverCursor = "button";
    this.crate.events.onInputUp.addOnce(this._crateClicked, this);

    this._complete(); // now that the crate is visible, we can advance the tutorial
};

GlassLab.DeliverPenAction.prototype._crateClicked = function() {
    var makeSmoke = function(x, y) {
        var smoke = GLOBAL.game.make.sprite(x, y, "smokeAnim");
        smoke.anchor.setTo(0.5, 1);
        smoke.animations.add("puff", Phaser.Animation.generateFrameNames("smoke_puff_crate_",259,285,".png",3), 24, false);
        smoke.play("puff");
        return smoke;
    };

    var smoke1 = this.crateRoot.addChild(makeSmoke(90, 300));
    this.crateRoot.addChild(makeSmoke(170, 370));
    this.crateRoot.addChild(makeSmoke(250, 300));

    GlassLab.SignalManager.tutorialAdvanced.dispatch(); // Indicate that the crate has been clicked

    smoke1.events.onAnimationComplete.addOnce(this._finishDelivery, this);

    this.highlightTween.stop();
    this.pen.sprite.visible = true;
    this.game.add.tween(this.pen.sprite).to({alpha: 1}, 1000, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.crate).to({alpha: 0}, 100, Phaser.Easing.Quadratic.InOut, true);
    this.game.add.tween(this.shadow).to({alpha: 0}, 100, Phaser.Easing.Quadratic.InOut, true);
};

GlassLab.DeliverPenAction.prototype._finishDelivery = function() {
    this.crateRoot.destroy();
    this.pen.tooltipDisabled = false;
    GlassLab.SignalManager.tutorialAdvanced.dispatch(); // Indicate that the pen is fully delivered
};

GlassLab.DeliverPenAction.prototype.Destroy = function()
{
    GlassLab.Action.prototype.Destroy.apply(this, arguments);
    if (this.crateRoot) this.crateRoot.destroy();
    if (this.highlightTween) this.highlightTween.stop();
    if (this.landTimer) this.game.time.events.remove(this.landTimer);
    if (this.pen) {
        this.pen.alpha = 1;
        this.pen.visible = true;
        this.pen.tooltipDisabled = false;
    }
};