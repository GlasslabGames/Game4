/**
 * Created by Jerry Fu on 2/13/2015.
 */

var GlassLab = GlassLab || {};

/**
 * DayMeter
 */
GlassLab.DayMeter = function(game)
{
    Phaser.Sprite.prototype.constructor.call(this, game);

    this.totalWidth = 480;
    this.barContainer = game.make.sprite(-this.totalWidth / 2, 0);
    this.addChild(this.barContainer);

    this.dotContainer = game.make.sprite();
    this.barContainer.addChild(this.dotContainer);
    this.challengeDots = [];

    this.objectiveContainer = game.make.sprite(0, 30);
    this.objectiveContainer.alpha = 0;
    this.barContainer.addChild(this.objectiveContainer);

    this.objectiveBg = game.make.sprite(-20,0, "questObjectiveBg");
    this.objectiveBg.tint = 0x000000;
    this.objectiveBg.alpha = 0.5;
    this.objectiveContainer.addChild(this.objectiveBg);

    this.objectiveArrow = game.make.sprite(0,0, "questObjectiveArrow");
    this.objectiveArrow.anchor.setTo(0.5, 1);
    this.objectiveArrow.tint = 0x000000;
    this.objectiveArrow.alpha = 0.5;
    this.objectiveContainer.addChild(this.objectiveArrow);

    this.objectiveLabel = game.make.text(0, 15, "", {fill: "#ffffff", font: "bold 16px Arial"});
    this.objectiveLabel.anchor.setTo(0, 0.5);
    this.objectiveContainer.addChild(this.objectiveLabel);

    this.barContainer.inputEnabled = true;
    this.barContainer.hitArea = new Phaser.Rectangle(-20,-25,520,50);
    this.barContainer.events.onInputOver.add(this._onInputOver, this);
    this.barContainer.events.onInputOut.add(this._onInputOut, this);

    // Use this rectangle to adjust the hitArea
    //this.barContainer.addChild(this.game.make.graphics().beginFill(0xffffff, 0.5).drawRect(-20, -25, 520, 50));

    this.sun = game.make.sprite(0,0,"questBarSun");
    this.sun.anchor.setTo(0.5, 0.5);
    this.sun.animations.add("idle", game.math.numberArray(0, 23), 48, true);
    this.sun.animations.add("spin", game.math.numberArray(24, 47), 48, true);
    this.sun.animations.play("idle");
    this.barContainer.addChild(this.sun);

    GlassLab.SignalManager.objectiveUpdated.add(this._onObjectiveUpdated,this);
};
// Extends Sprite
GlassLab.DayMeter.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.DayMeter.prototype.constructor = GlassLab.DayMeter;

GlassLab.DayMeter.prototype._onObjectiveUpdated = function(objectiveText)
{
    this.objectiveLabel.setText(objectiveText);

    if (!this.objectiveLabelAlertTween)
    {
        this.objectiveContainer.alpha = 0;
        this.objectiveLabelAlertTween = this.game.add.tween(this.objectiveContainer).to( {alpha: 1}, 250, "Linear").to( {alpha:1}, 3000).loop(true);
        this.objectiveLabelAlertTween.onRepeat.add(function(){
            this.objectiveLabelAlertTween.pause();
            this._onInputOut();
        }, this);
    }

    this.objectiveLabelAlertTween.resume();
    this.objectiveLabelAlertTween.start();
};

GlassLab.DayMeter.prototype._onInputOver = function()
{
    if (this.mouseOutTimer) this.game.time.events.remove(this.mouseOutTimer);
    this.sun.animations.play("spin");

    if (this.objectiveLabelAlertTween && !this.objectiveLabelAlertTween.isPaused)
    {
        return;
    }

    // Lazy-instantiate tween
    if (!this.objectiveLabelTweenIn)
    {
        this.objectiveContainer.alpha = 0;
        this.objectiveLabelTweenIn = this.game.add.tween(this.objectiveContainer).to( {alpha: 1}, 250, "Linear").loop(true);
        this.objectiveLabelTweenIn.onRepeat.add(function(){
            this.pause();
        }, this.objectiveLabelTweenIn);
    }

    // Stop other tween
    if (this.objectiveLabelTweenOut && !this.objectiveLabelTweenIn.isPaused)
    {
        this.objectiveLabelTweenOut.pause();
    }

    this.objectiveLabelTweenIn.resume();
    this.objectiveLabelTweenIn.start();
};

GlassLab.DayMeter.prototype._onInputOut = function()
{
    if (this.mouseOutTimer) this.game.time.events.remove(this.mouseOutTimer);
    this.mouseOutTimer = this.game.time.events.add(3000, this._hideObjective, this);
    this.sun.animations.play("idle");
};

GlassLab.DayMeter.prototype._hideObjective = function() {
    if (this.objectiveLabelAlertTween && !this.objectiveLabelAlertTween.isPaused) return;

    // Lazy-instantiate tween
    if (!this.objectiveLabelTweenOut)
    {
        this.objectiveContainer.alpha = 1;
        this.objectiveLabelTweenOut = this.game.add.tween(this.objectiveContainer).to( {alpha: 0}, 250, "Linear").loop(true);
        this.objectiveLabelTweenOut.onRepeat.add(function(){
            this.pause();
        }, this.objectiveLabelTweenOut);
    }

    // Stop other tween
    if (this.objectiveLabelTweenIn && !this.objectiveLabelTweenIn.isPaused)
    {
        this.objectiveLabelTweenIn.pause();
    }

    this.objectiveLabelTweenOut.resume();
    this.objectiveLabelTweenOut.start();
};

GlassLab.DayMeter.prototype.AnimateSunToPositionIndex = function(index)
{
    var targetX = this.challengeDots[index].x;

    var sunTween = this.game.add.tween(this.sun).to( {x: targetX }, 1500, Phaser.Easing.Cubic.InOut, true);
    sunTween.onComplete.add(function() {
        this.sun.animations.play("idle");
    }, this);
    this.sun.animations.play("spin");

    this.objectiveArrow.x = targetX;
};

GlassLab.DayMeter.prototype.SetSunToPositionIndex = function(index)
{
    this.sun.x = this.challengeDots[index].x;
    this.objectiveArrow.x = this.sun.x;
};

GlassLab.DayMeter.prototype.SetDots = function(numBigDots)
{
    var totalDots = [0, 15, 16, 15, 16, 17, 16][numBigDots];
    if (!totalDots) totalDots = 2 * numBigDots - 1; // default is one small dot between each big dot
    var offset = (totalDots-1) / (numBigDots - 1);

    this.challengeDots = [];
    var prevNumDots = this.dotContainer.children.length;
    var i = 0;
    for (; i < totalDots; i++) {
        var challengeDot = (numBigDots == 1 && i == (totalDots - 1) / 2) || (numBigDots > 1 && i % offset == 0);
        var spriteName = challengeDot? "questBarDotLarge" : "questBarDotSmall";

        var dot;
        if (i < prevNumDots) {
            dot = this.dotContainer.getChildAt(i);
            dot.visible = true;
            if (dot.key != spriteName) dot.loadTexture(spriteName);
        } else {
            dot = this.game.make.sprite(0,0,spriteName);
            dot.anchor.setTo(0.5, 0.5);
            this.dotContainer.addChild(dot);
        }

        dot.position.setTo(i * (this.totalWidth / (totalDots-1)), 0);
        dot.alpha = (challengeDot? 0.5 : 0.25);
        if (challengeDot) this.challengeDots.push(dot);
    }

    // Hide any extra dots
    for (; i < prevNumDots; i++) {
        this.dotContainer.getChildAt(i).visible = false;
    }

    return;
};