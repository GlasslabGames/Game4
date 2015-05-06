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

    // TODO: make crate appear offscreen and tween in

    this.pen.sprite.visible = false;
};