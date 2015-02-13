/**
 * Created by Jerry Fu on 2/12/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DayManager = function(game)
{
    this.game = game;

    this.currentDay = 0;
    this.currentSection = 0;
    this.totalSections = 3;
    this.dayText = game.add.text(0,0,"Day");
    this.dayText.fixedToCamera = true;
    this.sectionText = game.add.text(100,0,"3/2");
    this.sectionText.fixedToCamera = true;
    this._refresh();
};

GlassLab.DayManager.prototype.Advance = function()
{
    this.currentSection++;
    this._refresh();
};

GlassLab.DayManager.prototype.AdvanceDay = function()
{
    this.currentDay++;
    this._refresh();
};

GlassLab.DayManager.prototype._refresh = function()
{
    this.dayText.setText( "Day " + this.currentDay );
    this.sectionText.setText( (this.currentSection+1) + "/" + this.totalSections );
};