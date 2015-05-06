/**
 * Created by Jerry Fu on 5/5/2015.
 */

/**
 * CreatureStateCrazyRun - Run around like crazy for a specified amount of time
 * @param game
 * @param owner
 * @param duration
 * @constructor
 */
GlassLab.CreatureStateCrazyRun = function(game, owner, duration)
{
    GlassLab.CreatureState.call(this, game, owner);
    this.duration = duration;
    this.isCrazyRunning = false;
    this.heading = {x: Number.NaN, y: 0};
};

GlassLab.CreatureStateCrazyRun.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateCrazyRun.constructor = GlassLab.CreatureStateCrazyRun;

GlassLab.CreatureStateCrazyRun.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);

    this.creature.moveSpeed = this.creature.normalMoveSpeed * 10;

    this.creature.onDestinationReached.add(this._onCreatureDestinationReached, this);
    this.CrazyRun();
};

GlassLab.CreatureStateCrazyRun.prototype.Exit = function()
{
    this.StopCrazyRun();

    this.creature.moveSpeed = this.creature.normalMoveSpeed;

    this.creature.onDestinationReached.remove(this._onCreatureDestinationReached, this);

    GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateCrazyRun.prototype._onCreatureDestinationReached = function(dt)
{
    this._findNextTile();
};

GlassLab.CreatureStateCrazyRun.prototype.Update = function(dt) {
    if (this.isCrazyRunning)
    {
        this.duration -= dt;
        if (this.duration <= 0)
        {
            this.StopCrazyRun();
        }
        else
        {
            this.creature._move();
        }

    }
};

GlassLab.CreatureStateCrazyRun.prototype.CrazyRun = function() {
    if (!this.isCrazyRunning)
    {
        this.isCrazyRunning = true;

        this.creature.running = true;

        var animation = this.creature.PlayAnim("hyper_start");
        if (animation)
        {
            animation.onComplete.addOnce(function()
            {
                this.creature.PlayAnim("hyper_loop", true);
                this._findNextTile();
            }, this);
        }
        else
        {
            console.error("Creature tried to cry but couldn't find animation...");
        }
    }
};

GlassLab.CreatureStateCrazyRun.prototype._findNextTile = function() {
    var globalPosition = this.creature.getGlobalPos();
    var currentTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(globalPosition.x, globalPosition.y);

    var nextTile = null; // Next tile we want to walk to
    var tileCandidate = null; // Tile we're currently inspecting

    if (!isNaN(this.heading.x))
    {
        tileCandidate = GLOBAL.tileManager.GetTile(currentTile.col + this.heading.x, currentTile.row + this.heading.y);
        if (tileCandidate.getIsWalkable())
        {
            nextTile = tileCandidate;
        }
    }

    if (!nextTile)
    {
        var tileCandidates = [
            GLOBAL.tileManager.GetTile(currentTile.col - 1, currentTile.row),
            GLOBAL.tileManager.GetTile(currentTile.col + 1, currentTile.row),
            GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row - 1),
            GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row + 1)
        ];

        while (tileCandidates.length > 0)
        {
            var randomIndex = Math.floor(Math.random()*tileCandidates.length);
            tileCandidate = tileCandidates[randomIndex];
            tileCandidates.splice(randomIndex, 1);

            if (tileCandidate && tileCandidate.getIsWalkable())
            {
                nextTile = tileCandidate;
                // Going back the way we came is boring, so only settle on it last
                if (currentTile.col - tileCandidate.col != this.heading.x || currentTile.row - tileCandidate.row != this.heading.y)
                {
                    break;
                }
            }
        }
    }

    if (nextTile)
    {
        this.heading.x = nextTile.col - currentTile.col;
        this.heading.y = nextTile.row - currentTile.row;

        this.creature.PathToTile(nextTile);
    }
    else
    {
        console.error("Creature cannot find next a direction to head towards!");
    }
};

GlassLab.CreatureStateCrazyRun.prototype.StopCrazyRun = function() {
    if (this.isCrazyRunning)
    {
        var animation = this.creature.PlayAnim("hyper_end");
        if (animation)
        {
            animation.onComplete.addOnce(function()
            {
                this.creature.running = false;
                this.creature.lookForTargets();
            }, this);
        }
        else
        {
            console.error("Creature tried to stop crying but couldn't find animation...");
        }

        this.isCrazyRunning = false;
    }
};