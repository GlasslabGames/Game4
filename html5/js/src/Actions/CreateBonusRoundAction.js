/**
 * Created by Jerry Fu on 2/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreateBonusRoundAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
};

GlassLab.CreateBonusRoundAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreateBonusRoundAction.prototype.constructor = GlassLab.CreateBonusRoundAction;

GlassLab.CreateBonusRoundAction.prototype.Do = function()
{
    this._complete();
};