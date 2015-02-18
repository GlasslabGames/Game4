/**
 * Created by Jerry Fu on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.FeedAnimalCondition = function(game, creatureType, numCreatures)
{
    GlassLab.Conditional.prototype.constructor.call(this);

    this.acceptedType = creatureType;
    this.numRequired = numCreatures;

    this.numFed = 0;

    this.game = game;
};

GlassLab.FeedAnimalCondition.prototype = Object.create(GlassLab.Conditional.prototype);
GlassLab.FeedAnimalCondition.prototype.constructor = GlassLab.FeedAnimalCondition;

GlassLab.FeedAnimalCondition.prototype._calculateIsSatisfied = function()
{
    return this.numFed >= this.numRequired;
};

GlassLab.FeedAnimalCondition.prototype._onCreatureFed = function(creature)
{
    if (this.acceptedType.indexOf(creature.type) != -1)
    {
        this.numFed++;
    }

    this.Refresh();
};

GlassLab.FeedAnimalCondition.prototype._onFeedPenResolved = function(pen, win)
{
    if (this.acceptedType.indexOf(pen.creatureType) != -1)
    {
        if (win)
        {
            this.numFed = pen.creatures.length;
        }
    }

    this.Refresh();
};

GlassLab.FeedAnimalCondition.prototype.init = function()
{
    GlassLab.SignalManager.creatureFed.add(this._onCreatureFed, this);
    GlassLab.SignalManager.feedingPenResolved.add(this._onFeedPenResolved, this);
};