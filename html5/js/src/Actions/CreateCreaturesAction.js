/**
 * Created by Jerry Fu on 2/13/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.CreateCreaturesAction = function(game, data)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game || GLOBAL.game;
    this.data = data;
    this.centered = false;
};

GlassLab.CreateCreaturesAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.CreateCreaturesAction.prototype.constructor = GlassLab.CreateCreaturesAction;

GlassLab.CreateCreaturesAction.prototype.Do = function()
{
    for (var type in this.data) {
        for (var j = 0; j < this.data[type]; j++) {
            var creature = GLOBAL.creatureManager.CreateCreature(type);
            if (this.centered) { // kinda hacky way to make sure the creatues we create are in the middle of the map
                creature.moveToTile( GLOBAL.tileManager.tilemap.width/2, GLOBAL.tileManager.tilemap.height/2 );
                creature.lookForTargets();
            }
        }
    }

    this._complete();
};