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

    this.barContainer = game.make.sprite();
    this.addChild(this.barContainer);

    this.bar = game.make.graphics(-200,0);
    this.bar.lineStyle(3, 0).moveTo(0,0).lineTo(400,0);
    this.barContainer.addChild(this.bar);

    this.sun = game.make.graphics(0,0);
    this.sun.beginFill(0xffffff).lineStyle(GlassLab.DayMeter.LINE_THICKNESS, 0).drawCircle(0,0, GlassLab.DayMeter.SUN_RADIUS);
    this.barContainer.addChild(this.sun);
    this.sunLabel = game.make.text(0,0,"Sun", {font: "16px Helvetica"});
    this.sunLabel.anchor.setTo(.5, .5);
    this.sun.addChild(this.sunLabel);

    this.dots = [];
    this.SetDots([0, .5, 1]);

    this.objectiveElement = game.make.graphics(0,this.bar.y+40);
    this.objectiveElement.beginFill(0).drawRect(-250, 0, 500, 30);
    this.objectiveElement.inputEnabled = true;
    this.objectiveElement.inputPriority = 1;
    this.addChild(this.objectiveElement);

    this.objectiveDayPointer = game.make.graphics(0,-10);
    this.objectiveDayPointer.beginFill(0).drawPolygon(
        -10,10,
        0,0,
        10,10
    );
    this.objectiveElement.addChild(this.objectiveDayPointer);

    this.objectiveLabel = game.make.text(0, 3, "{Objective}", {fill: "#ffffff", font: "20px Arial"});
    this.objectiveLabel.anchor.setTo(.5, 0);
    this.objectiveElement.addChild(this.objectiveLabel);
    this.objectiveElement.alpha = 0; // Alpha is managed by DayMeter
    GLOBAL.dayMeter = this.objectiveElement;

    this.barContainer.inputEnabled = true;
    this.barContainer.events.onInputOver.add(this._onInputOver, this);
    this.barContainer.events.onInputOut.add(this._onInputOut, this);

    GlassLab.SignalManager.objectiveUpdated.add(this._onObjectiveUpdated,this);
};

GlassLab.DayMeter.SUN_RADIUS = 40;
GlassLab.DayMeter.LINE_THICKNESS = 3;
GlassLab.DayMeter.NODE_RADIUS = 20;

// Extends Sprite
GlassLab.DayMeter.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.DayMeter.prototype.constructor = GlassLab.DayMeter;

GlassLab.DayMeter.prototype._onObjectiveUpdated = function(objectiveText)
{
    this.objectiveLabel.setText(objectiveText);

    if (!this.objectiveLabelAlertTween)
    {
        this.objectiveElement.alpha = 0;
        this.objectiveLabelAlertTween = this.game.add.tween(this.objectiveElement).to( {alpha: 1}, 250, "Linear").to( {alpha:1}, 3000).loop(true);
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
    if (this.objectiveLabelAlertTween && !this.objectiveLabelAlertTween.isPaused)
    {
        return;
    }

    // Lazy-instantiate tween
    if (!this.objectiveLabelTweenIn)
    {
        this.objectiveElement.alpha = 0;
        this.objectiveLabelTweenIn = this.game.add.tween(this.objectiveElement).to( {alpha: 1}, 250, "Linear").loop(true);
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
    if (this.objectiveLabelAlertTween && !this.objectiveLabelAlertTween.isPaused)
    {
        return;
    }

    // Lazy-instantiate tween
    if (!this.objectiveLabelTweenOut)
    {
        this.objectiveElement.alpha = 1;
        this.objectiveLabelTweenOut = this.game.add.tween(this.objectiveElement).to( {alpha: 0}, 250, "Linear").loop(true);
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

GlassLab.DayMeter.prototype._createDot = function()
{
    var dot = this.game.make.graphics(0,0);
    dot.beginFill(0xffffff).lineStyle(GlassLab.DayMeter.LINE_THICKNESS, 0).drawCircle(0,0, GlassLab.DayMeter.NODE_RADIUS);
    return dot;
};

GlassLab.DayMeter.prototype.AnimateSunToPositionIndex = function(index, animate)
{
    var targetX = this.dots[index].x + this.bar.x;
    if (targetX > 0) targetX -= GlassLab.DayMeter.LINE_THICKNESS;

    var sunTween = this.game.add.tween(this.sun).to( {x: targetX }, 1500, Phaser.Easing.Cubic.InOut, true);

    this.objectiveDayPointer.x = targetX;
};

GlassLab.DayMeter.prototype.SetSunToPositionIndex = function(index, animate)
{
    this.sun.x = this.dots[index].x + this.bar.x;
    if (this.sun.x > 0) this.sun.x -= GlassLab.DayMeter.LINE_THICKNESS;

    this.objectiveDayPointer.x = this.sun.x;
};

GlassLab.DayMeter.prototype.SetDots = function(positions)
{
    var dotIndex = 0;
    var numDotsBeforeSet = this.dots.length;
    var numPositions = positions.length;
    for (; dotIndex < numPositions; dotIndex++)
    {
        var dot;
        if (dotIndex < numDotsBeforeSet)
        {
            dot = this.dots[dotIndex];
            dot.visible = true;
        }
        else
        {
            dot = this._createDot();
            this.bar.addChild(dot);
            this.dots.push(dot);
        }

        var position = positions[dotIndex];
        dot.x = position * this.bar.width;
        if (dot.x > 0) dot.x -= 3;
    }

    // Hide any extra dots
    for (; dotIndex < numDotsBeforeSet; dotIndex++)
    {
        var dot = this.dots[dotIndex];
        dot.visible = false;
    }
};