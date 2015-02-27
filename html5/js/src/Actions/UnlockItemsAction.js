/**
 * Created by Rose Abernathy on 2/27/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UnlockItemsAction = function()
{
    GlassLab.Action.prototype.constructor.call(this);
};

GlassLab.UnlockItemsAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.UnlockItemsAction.prototype.constructor = GlassLab.UnlockItemsAction;

GlassLab.UnlockItemsAction.prototype.Do = function()
{
    for (var i=0; i < this.items.length; i++)
    {
        GLOBAL.inventoryManager.unlock(this.items[i]);
    }

    this._complete();
};