/**
 * Created by Jerry Fu on 2/13/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreateCreaturesAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    this.looseCreatureData = data;
};

GlassLab.CreateCreaturesAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreateCreaturesAction.prototype.constructor = GlassLab.CreateCreaturesAction;

GlassLab.CreateCreaturesAction.prototype.Do = function()
{
    for (var type in this.looseCreatureData) {
        for (var j = 0; j < this.looseCreatureData[type]; j++) {
            var creature = new GlassLab.Creature(this.game, type);
            GLOBAL.creatureLayer.add(creature.sprite);
            creature.moveToRandomTile();
            creature._onTargetsChanged();
        }
    }

    this._complete();
};