/**
 * Created by Rose Abernathy on 2/25/2015.
 */

GlassLab.ShowArrowAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

};

GlassLab.ShowArrowAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.ShowArrowAction.prototype.constructor = GlassLab.ShowArrowAction;

GlassLab.ShowArrowAction.prototype.Do = function()
{
    GLOBAL.UIManager.showArrow(this.direction, this.anchor, this.xPosition, this.yPosition);
    this._complete();
};

GlassLab.HideArrowAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);

};

GlassLab.HideArrowAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.HideArrowAction.prototype.constructor = GlassLab.HideArrowAction;

GlassLab.HideArrowAction.prototype.Do = function()
{
    GLOBAL.UIManager.hideArrow();
    this._complete();
};