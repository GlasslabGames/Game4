/**
 * Created by Jerry Fu on 12/17/2014.
 */

var GlassLab = GlassLab || {};

/**
 * Creature
 */
GlassLab.Creature = function (game, type, startInPen) {
    this.type = type;
    var info = GLOBAL.creatureManager.creatureDatabase[type];
    this.sprite = game.make.isoSprite();

    this.game = game;
    this.state = null;

    this.sprite.inputEnabled = true;
    this.sprite.draggable = false; // set this in each state
    this.prevIsoPos = new Phaser.Point();
    this.prevTile = null;

    this.sprite.events.onInputUp.add(this._onUp, this);
    this.sprite.events.onInputDown.add(this._onDown, this);

    this.sprite.scale.setTo(-0.25, 0.25);

    this.targetPosition = null;
    this.currentPath = [];

    this.moveSpeed = 2.75;
    this.baseAnimSpeed = 36; // 36 per moveSpeed

    this.debugAILine = new Phaser.Line();

    this.desiredAmountsOfFood = {};
    this.foodEaten = {};
    var totalFoodDesired = 0; // count so that we know what percentage of the hunger bar should go to this food
    for (var i = 0, len = info.desiredFood.length; i < len; i++) {
        var desiredFood = info.desiredFood[i];
        this.desiredAmountsOfFood[desiredFood.type] = desiredFood.amount;
        this.foodEaten[desiredFood.type] = 0;
        totalFoodDesired += desiredFood.amount;
    }
    var hungerBarSections = {};
    for (var type in this.desiredAmountsOfFood) {
        var foodInfo = GlassLab.FoodTypes[type];
        hungerBarSections[type] = {percent: this.desiredAmountsOfFood[type] / totalFoodDesired, color: foodInfo.color };
    };
    this.hungerBar = new GlassLab.FillBar(this.game, 500, 100, hungerBarSections);
    this.sprite.addChild(this.hungerBar.sprite);
    this.hungerBar.sprite.visible = false;

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.targetFood = []; // tracks the food we want to eat next while we're eating food in a pen. Each food is like {food: f, eatPartially: true}

    this.shadow = this.game.make.sprite(0, 0, "shadow");
    this.sprite.addChild(this.shadow);
    this.shadow.anchor.setTo(0.5, 0.8);

    this.animSprites = {};
    var animNames = ["idle", "idle_back", "walk", "walk_back", "eat", "vomit"];
    for (var i = 0; i < animNames.length; i++) {
        var spriteName = info.spriteName + "_" + animNames[i];
        var animSprite = this.game.make.sprite(0, 0, spriteName);
        animSprite.anchor.setTo(0.5, 0.8);
        animSprite.animations.add('anim'); // this animation uses the whole spritesheet
        this.sprite.addChild(animSprite);
        animSprite.visible = false;
        animSprite.tint = info.spriteTint || 0xffffff; // temporary way to distinguish creatures
        this.animSprites[animNames[i]] = animSprite;
    }

    this.animSprites.idle.visible = true;
    this.spriteHeight = this.animSprites.idle.height; // for future reference

    this.hungerBar.sprite.y = -this.spriteHeight * this.sprite.scale.y * 4;

    //game.physics.isoArcade.enable(this.sprite);
    this.sprite.events.onDestroy.add(this._onDestroy, this);

    this.targetsChangedHandler = GlassLab.SignalManager.creatureTargetsChanged.add(this._onTargetsChanged, this);


    // FINALLY, start the desired state
    if (startInPen) {
        this.pen = startInPen;
        this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(game, this));
    } else {
        this.StateTransitionTo(new GlassLab.CreatureStateIdle(game, this));
    }

    this.id = GLOBAL.creatureManager.creatures.length; // used for telemetry
    GLOBAL.creatureManager.AddCreature(this);

    this.onPathChanged = new Phaser.Signal();
    this.onDestinationReached = new Phaser.Signal();
};

GlassLab.Creature.prototype._onDestroy = function () {
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null;
    this.sprite.events.destroy();
    if (this.updateHandler) this.updateHandler.detach();
    if (this.targetsChangedHandler) this.targetsChangedHandler.detach();
    if (this.state) this.state.Exit(); // wrap up the current state

    GLOBAL.creatureManager.RemoveCreature(this);
};

GlassLab.Creature.prototype.print = function () {
    var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
    var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
    return "Creature(" + col + ", " + row + ")";
};

GlassLab.Creature.prototype.setType = function (type) {
    if (this.type == type) return;
    this.type = type;
    var info = GLOBAL.creatureManager.creatureDatabase[type];
    for (var key in this.animSprites) {
        this.animSprites[key].loadTexture(info.spriteName + "_" + key);
    }
    // This hasn't been tested yet!
};

GlassLab.Creature.prototype.moveToTile = function (col, row) {
    var tile = GLOBAL.tileManager.GetTile(col, row);

    this.sprite.isoX = tile.isoX;
    this.sprite.isoY = tile.isoY;

    if (Math.random() > 0.5) // face a random direction too
    {
        this.sprite.scale.x *= -1;
    }
};

GlassLab.Creature.prototype.moveToRandomTile = function () {
    var tile = GLOBAL.tileManager.getRandomWalkableTile();

    this.sprite.isoX = tile.isoX;
    this.sprite.isoY = tile.isoY;

    if (Math.random() > 0.5) // face a random direction too
    {
        this.sprite.scale.x *= -1;
    }
};

GlassLab.Creature.prototype.PlayAnim = function (anim, loop, framerate) { // anim should be "walk", "eat", etc. Possibly pull into an enum?
    if (anim == this.currentAnimName) return; // no need to do anything
    var spriteName = GLOBAL.creatureManager.creatureDatabase[this.type].spriteName;

    if (anim) this.facingBack = anim.indexOf("back") > -1; // remember if we're facing back for next time
    else anim = "idle" + (this.facingBack ? "_back" : ""); // no anim = idle (facing back if we had been before)
    this.currentAnimName = anim;

    if (!framerate) framerate = 48;
    var playedAnim;

    for (var animName in this.animSprites) {
        var animation = this.animSprites[animName];
        if (animName == anim) {
            animation.visible = true;
            playedAnim = animation.animations.play('anim', framerate, loop);
        } else {
            animation.visible = false;
            animation.animations.stop();
        }
    }

    return playedAnim;
};

GlassLab.Creature.prototype.StopAnim = function () {
    this.PlayAnim(); // no anim -> stand still
};

GlassLab.Creature.prototype.standFacing = function (dir) {
    if (dir == "left" || dir == "up") this.PlayAnim("idle_back");
    else this.PlayAnim("idle");
    this.sprite.scale.x = Math.abs(this.sprite.scale.x) * ((dir == "left" || dir == "right") ? -1 : 1);
};

GlassLab.Creature.prototype._onUp = function (sprite, pointer) {
    if (this.draggable && GLOBAL.stickyMode && !GLOBAL.dragTarget && !GLOBAL.justDropped) {
        this._startDrag();
    } else if (!GLOBAL.stickyMode && GLOBAL.dragTarget == this) {
        this._endDrag();
    }
    if (GLOBAL.dragTarget != this && !this.getIsEmpty()) this.hungerBar.show(true, 1); // if we're not currently dragging, show the hunger bar for 1 sec
};

GlassLab.Creature.prototype._onDown = function (sprite, pointer) {
    if (!GLOBAL.stickyMode && this.draggable && !GLOBAL.dragTarget) {
        this._startDrag();
    }
};

GlassLab.Creature.prototype.PathToTileCoordinate = function(col, row)
{
    var tile = GLOBAL.tileManager.GetTile(col, row);
    this.PathToTile(tile);
};

// A*
GlassLab.Creature.prototype.PathToTile = function(goalTile)
{
    //this.PathToIsoPosition(goalTile.isoX + .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize, goalTile.isoY + .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize);
    this.PathToIsoPosition(goalTile.isoX, goalTile.isoY);
};

GlassLab.Creature.prototype.PathToIsoPosition = function(x, y)
{
    this._clearPath();

    var start = GLOBAL.tileManager.GetTileIndexAtWorldPosition(this.sprite.isoX, this.sprite.isoY);
    var goal = GLOBAL.tileManager.GetTileIndexAtWorldPosition(x, y);
    console.log("Path to",x,y,goal);
    var path = GLOBAL.astar.findPath(start, goal, null, this.type);

    if (path.nodes.length > 0)
    {
        this.currentPath.push(new Phaser.Point(x, y));

        for (var i=1; i < path.nodes.length-1; i++)
        {
            var position;
            this.currentPath.push(position = GLOBAL.tileManager.GetTileWorldPosition(path.nodes[i].x, path.nodes[i].y));
            position.x += .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize;
            position.y += .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize;
        }
    }

    this.onPathChanged.dispatch(this);
};

GlassLab.Creature.prototype._startDrag = function () {
    if (GLOBAL.dragTarget != null) return;
    this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
    if (this.pen) this.exitPen(this.pen);
    this.currentPath = [];
    this.targetPosition = null;
    GLOBAL.dragTarget = this;
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

GlassLab.Creature.prototype._endDrag = function () {
    GLOBAL.dragTarget = null;
    this.lookForTargets(); // figure out the nearest target (will go to Traveling, WaitingForFood, or Idle)
};

GlassLab.Creature.prototype.OnStickyDrop = function () { // called by (atm) prototype.js
    this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function () {
    if (this.state) this.state.Update();

    if (GLOBAL.debug) {
        for (var i=0; i < this.currentPath.length; i++)
        {
            var point = this.currentPath[i];
            var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(point.x, point.y);
            tile.tint = 0xFF0000;
        }
    }
};

GlassLab.Creature.prototype._setNextTargetPosition = function()
{
    if (this.currentPath.length > 0)
    {
        this.targetPosition = this.currentPath.pop();
        var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.targetPosition.x, this.targetPosition.y);

        if (!tile.getIsWalkable(this.type))
        {
            this._clearPath();
            this.onDestinationReached.dispatch(this);

            return false;
        }

        if (GLOBAL.debug)
        {
            tile.tint = 0x0000ff;
        }

        var delta = Phaser.Point.subtract(this.targetPosition, this.sprite.isoPosition);
        var debugPoint = this.game.iso.project(new Phaser.Plugin.Isometric.Point3(delta.x, delta.y, 0));
        if (debugPoint.y < 0)
        {
            this.PlayAnim('walk_back', true, this.baseAnimSpeed * this.moveSpeed);
            this.sprite.scale.x = Math.abs(this.sprite.scale.x) * (debugPoint.x < 0 ? -1 : 1);
        }
        else
        {
            this.PlayAnim('walk', true, this.baseAnimSpeed * this.moveSpeed);

            this.sprite.scale.x = Math.abs(this.sprite.scale.x) * (debugPoint.x > 0 ? -1 : 1);
        }

        return true;
    }
    else
    {
        return false;
    }
};

GlassLab.Creature.prototype._move = function() {
    if (!this.targetPosition && !this._setNextTargetPosition())
    {
        return;
    }

    // Move towards current point
    var delta = Phaser.Point.subtract(this.targetPosition, this.sprite.isoPosition);
    if (delta.getMagnitudeSq() > this.moveSpeed * this.moveSpeed) {
        delta.setMagnitude(this.moveSpeed);
    }
    else {
        // If the delta magnitude is less than our move speed, we're done after this frame.

        // Find new point along path
        if (!this._setNextTargetPosition())
        {
            this.StopAnim();
            this.targetPosition = null;

            this.onDestinationReached.dispatch(this);
        }

        // Physics
        if (this.sprite.body) {
            this.sprite.body.velocity.setTo(0, 0);
            return;
        }
    }

    if (this.sprite.body) {
        // Physics
        this.sprite.body.velocity.x = delta.x * 100.0;
        this.sprite.body.velocity.y = delta.y * 100.0;
    }
    else {
        Phaser.Point.add(this.sprite.isoPosition, delta, delta);

        this.sprite.isoX = delta.x;
        this.sprite.isoY = delta.y;

        if (GLOBAL.debug)
        {
            var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
            tile.tint = 0xffffff;
        }
    }
};

GlassLab.Creature.prototype.FinishEating = function (result) {
    this.hungerBar.show(false);
    this.Emote(result == "satisfied");

    if (result == "satisfied") {
        this.pen.SetCreatureFinishedEating(true);
    } else {
        this.pen.FinishFeeding(result);
    }
};

GlassLab.Creature.prototype.resetFoodEaten = function () {
    for (var key in this.foodEaten) this.foodEaten[key] = 0;
    this.hungerBar.reset();
};

GlassLab.Creature.prototype.getIsSatisfied = function () {
    for (var key in this.foodEaten) {
        if (this.foodEaten[key] + 0.01 < this.desiredAmountsOfFood[key]) return false; // add a little padding
    }
    return true;
};

GlassLab.Creature.prototype.getIsSick = function () {
    for (var key in this.foodEaten) {
        if (this.foodEaten[key] - 0.01 > this.desiredAmountsOfFood[key]) return true; // add a little padding
    }
    return false;
};

GlassLab.Creature.prototype.getIsEmpty = function () {
    for (var key in this.foodEaten) {
        if (this.foodEaten[key] > 0) return false;
    }
    return true;
};

GlassLab.Creature.prototype.addTargetFood = function(food, eatPartially) {
    this.targetFood.push({food: food, eatPartially: eatPartially});
};

GlassLab.Creature.prototype.resetTargetFood = function() {
    this.targetFood = [];
};

GlassLab.Creature.prototype.Emote = function (happy) {
    var spriteName = (happy) ? "happyEmote" : "angryEmote";
    this.emote = this.game.make.sprite(0, 0, spriteName);
    this.emote.y = -2 * this.spriteHeight * this.sprite.scale.y;
    var size = this.emote.height * 3; // assumes the height and width are the same
    this.emote.height = this.emote.width = 0;
    this.game.add.tween(this.emote).to({
        y: -3 * this.spriteHeight * this.sprite.scale.y,
        height: size,
        width: size
    }, 100, Phaser.Easing.Linear.Out, true);
    this.emote.anchor.set(0.5, 1);
    this.sprite.addChild(this.emote);
    this.game.time.events.add(Phaser.Timer.SECOND * 1, function () {
        this.emote.destroy();
    }, this);
};

GlassLab.Creature.prototype.ShowHungerBar = function (currentlyEatingAmount, foodType, hideAfter) {
    var amountEaten = this.foodEaten[foodType] + currentlyEatingAmount;
    this.hungerBar.setAmount(foodType, amountEaten / this.desiredAmountsOfFood[foodType], true, hideAfter); // true -> animate change
};

GlassLab.Creature.prototype.HideHungerBar = function () {
    this.hungerBar.sprite.visible = false;
};

GlassLab.Creature.prototype._onTargetsChanged = function() {
    console.log(this.name,"targets changed. State:",this.state);
    if (this.state instanceof GlassLab.CreatureStateIdle || this.state instanceof GlassLab.CreatureStateTraveling) {
        this.lookForTargets();
    }
};

GlassLab.Creature.prototype.lookForTargets = function () {
    var targets = []; // a list of targets like { pos: world position, pen: pen} or { pos: world position, food: food }
    // Look for pen spots we could enter
    for (var i = 0; i < GLOBAL.penManager.pens.length; i++) {
        if (GLOBAL.penManager.pens[i].creatureType == this.type) { // TODO: this shouldn't depend on a preset creature type but use current food
            targets = targets.concat(GLOBAL.penManager.pens[i].getAvailableSpots());
        }
    }

    // Look for food we could eat
    for (var i = 0; i < GLOBAL.foodInWorld.length; i++) {
        var food = GLOBAL.foodInWorld[i];
        if (food && food.health && !food.eaten && food.type in this.desiredAmountsOfFood) {
            targets = targets.concat(food.getTargets());
        }
    }

    console.log(this.name,"lookForTargets. Targets:",targets);

    var minDist = null, bestTarget;
    for (var i = 0, len = targets.length; i < len; i++) {
        var distSqr = Math.pow((this.sprite.isoX - targets[i].pos.x), 2) + Math.pow((this.sprite.isoY - targets[i].pos.y), 2);
        if (minDist == null || distSqr < minDist) {
            minDist = distSqr;
            bestTarget = targets[i];
        }
    }

    var maxNoticeDist = GLOBAL.tileSize * 190; // so large as to be irrelevant for now
    var reachedTarget = false;
    if (bestTarget && minDist < GLOBAL.tileSize * GLOBAL.tileSize) { // we're less than a tile away from our target
        if (bestTarget.pen && this.tryEnterPen(bestTarget.pen)) { // if we're actually in the pen now
            reachedTarget = true;
        } else if (bestTarget.food ) { // we're on top of some food
            this.eatFreeFood(bestTarget.food);
            reachedTarget = true;
        }
    }
    if (!reachedTarget) { // if we weren't already on a target
        if (bestTarget && minDist <= maxNoticeDist * maxNoticeDist) {
            if (bestTarget.pen && !this.getIsEmpty()) { // if the creature wants to enter a pen, it vomits first ...
                this.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this));
            /*} else if (this.state instanceof GlassLab.CreatureStateTraveling) { // rather than restarting the traveling state, just set the new target
                this.state.target = bestTarget;*/
            } else {
                this.StateTransitionTo(new GlassLab.CreatureStateTraveling(this.game, this, bestTarget));
            }
        } else {
            this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
        }
    }
};

// call this to eat some food outside of a pen
GlassLab.Creature.prototype.eatFreeFood = function (food) {
    var result = "hungry";
    // check what the result will be when we add 1 whole food
    this.foodEaten[food.type] += 1;
    if (this.getIsSick()) result = "sick";
    else if (this.getIsSatisfied()) result = "satisfied";
    this.foodEaten[food.type] -= 1; // revert, since we haven't actually eaten the food yet

    GlassLabSDK.saveTelemEvent("creature_eats", {
        creature_id: this.id,
        creature_type: this.type,
        food_type: food.type,
        result: result
    });
    this.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this, {food: food}));
};

GlassLab.Creature.prototype.tryEnterPen = function (pen) {
    console.log(this.name,"trying to enter pen");
    var tile = this.getTile();
    if (pen.canAddCreature(this, tile)) { // note that this will parent the creature under the pen
        this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this));
        return pen.tryAddCreature(this, tile);
    } else {
        return false;
    }
};

GlassLab.Creature.prototype.exitPen = function (pen) {
    if (this.pen != pen) {
        return false;
    }
    console.log(this.name,"trying to leave pen.");
    return pen.tryRemoveCreature(this);
};

GlassLab.Creature.prototype.setIsoPos = function (x, y) {
    this.sprite.isoX = x;
    this.sprite.isoY = y;

    this._clearPath();
};

GlassLab.Creature.prototype._clearPath = function()
{
    this.currentPath = [];
    this.targetPosition = null;
    this.StopAnim();
};

GlassLab.Creature.prototype.StateTransitionTo = function (targetState) {
    if (targetState == this.state) {
        console.warn("Target state was the same as current state ("+this.state+"), ignoring transition request...");
        return;
    }

    if (this.state) {
        this.state.Exit();
    }

    this.state = targetState;

    if (this.state) {
        this.state.Enter();
    }
};

GlassLab.Creature.prototype.getTile = function () {
    var isoPosition = this.getGlobalIsoPos();
    return GLOBAL.tileManager.GetTileAtIsoWorldPosition(isoPosition.x, isoPosition.y);
};

GlassLab.Creature.prototype.getGlobalIsoPos = function () {
    var sprite = this.sprite;
    var pos = new Phaser.Point(sprite.isoX, sprite.isoY);
    while (sprite.parent && sprite.parent.isoPosition) {
        sprite = sprite.parent;
        pos.x += sprite.isoX;
        pos.y += sprite.isoY;
    }
    return pos;
};
