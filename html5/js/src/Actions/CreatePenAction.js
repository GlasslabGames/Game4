/**
 * Created by Jerry Fu on 2/13/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreatePenAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
    this.penData = data;
};

GlassLab.CreatePenAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreatePenAction.prototype.constructor = GlassLab.CreatePenAction;

GlassLab.CreatePenAction.prototype.Do = function()
{
    if (this.penData) {
        var widths = [
            (this.penData.creatureWidth || 1),
            (this.penData.foodWidth || this.penData.foodAWidth || 1)
        ];
        if (this.penData.foodBWidth) widths.push(this.penData.foodBWidth);

        var pen = new GlassLab.FeedingPen(
            this.game,
            GLOBAL.penLayer,
            this.penData.type,
            (this.penData.height || 1),
            widths,
            this.penData.autoFill
        );

        // set which edges are adjustable here (defaults to the right side only)
        if (this.penData.leftDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.left, true);
        if (this.penData.bottomDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.bottom, true);
        if (this.penData.topDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.top, true);
    }

    this._complete();
};