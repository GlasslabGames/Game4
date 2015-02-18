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

    GlassLab.SignalManager.levelLoaded.add(this._refresh, this);

    this._refresh();
};

GlassLab.DayManager.prototype.Advance = function()
{
    this.currentSection++;
    this._refresh();
};

GlassLab.DayManager.prototype.AdvanceDay = function()
{
    this._refresh();
};

GlassLab.DayManager.prototype._refresh = function()
{
    this.dayText.setText( "Day " + (GLOBAL.levelManager.currentLevel+1) );
    if (this.currentSection == 0)
    {
        this.dayMeter.SetSunToPositionIndex(this.currentSection);
    }
    else
    {
        this.dayMeter.AnimateSunToPositionIndex(this.currentSection);
    }
};