/**
 * Created by Jerry Fu on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.FeedAnimalCondition = function(game, creatureTypes, numCreatures)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.acceptedTypes = creatureTypes;
    this.numRequired = numCreatures;

    this.numFed = 0;

    this.game = game;
};

GlassLab.FeedAnimalCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.FeedAnimalCondition.prototype.constructor = GlassLab.FeedAnimalCondition;

GlassLab.FeedAnimalCondition.prototype._calculateIsSatisfied = function()
{
    return this.numRequired >= this.numFed;
};

GlassLab.FeedAnimalCondition.prototype._onCreatureFed = function(creature)
{
    if (this.acceptedTypes.indexOf(creature.type) != -1)
    {
        this.numFed++;
    }

    this.Refresh();
};

GlassLab.FeedAnimalCondition.prototype.init = function()
{
    GlassLab.SignalManager.creatureFed.add(this._onCreatureFed, this);
};