/**
 * Created by Jerry Fu on 2/12/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DayManager = function(game)
{
    this.game = game;

    this.currentSection = 0;
    this.totalSections = 3;

    this.dayMeter = new GlassLab.DayMeter(game);
    this.dayMeter.x = 30;
    this.dayMeter.y = 30;
    GLOBAL.UIManager.topAnchor.addChild(this.dayMeter);

    this.dayTextBg = game.make.graphics(-270,0);
    this.dayTextBg.beginFill(0xffffff).lineStyle(3, 0).drawRect(-35,-10,70, 20);
    this.dayMeter.addChild(this.dayTextBg);
    this.dayText = game.make.text(0,0,"Day", {font: "16px Helvetica"});
    this.dayText.anchor.setTo(.5, .5);
    this.dayTextBg.addChild(this.dayText);

    this.dayNum = 0;

    GlassLab.SignalManager.levelLoaded.add(this._refresh, this);
    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);

    this._refresh();
};

GlassLab.DayManager.prototype._onSaveRequested = function(blob)
{
    blob.currentSection = this.currentSection;
    blob.dotPositions = this.dayMeter.dotPositions;
};

GlassLab.DayManager.prototype._onGameLoaded = function(blob)
{
    this.currentSection = blob.currentSection;
    this.dayMeter.SetDots(blob.dotPositions);

    this._refresh();
};

GlassLab.DayManager.prototype.Advance = function()
{
    this.currentSection++;
    this._refresh();

    GLOBAL.saveManager.Save("current_section");
};

GlassLab.DayManager.prototype.AdvanceDay = function()
{
    this._refresh();
};

GlassLab.DayManager.prototype.SetDay = function(dayNum)
{
    this.dayNum = dayNum;
    this._refresh();
};

GlassLab.DayManager.prototype._refresh = function()
{
    this.dayText.setText( "Day " + this.dayNum );

    if (this.currentSection < this.dayMeter.dots.length)
    {
        if (this.currentSection == 0)
        {
            this.dayMeter.SetSunToPositionIndex(this.currentSection);
        }
        else
        {
            this.dayMeter.AnimateSunToPositionIndex(this.currentSection);
        }
    }
    else
    {
        console.error("Not enough dots to display day position");
    }
};