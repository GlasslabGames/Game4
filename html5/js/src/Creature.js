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

    this.isCrying = false;

    this.sprite.inputEnabled = true;
    this.sprite.draggable = false; // set this in each state
    this.prevIsoPos = new Phaser.Point();
    this.prevTile = null;

    //this.sprite.events.onInputUp.add(this._onUp, this);
    //this.sprite.events.onInputDown.add(this._onDown, this);

    this.sprite.scale.setTo(-0.5, 0.5);

    this.targetPosition = new Phaser.Point(Number.NaN);
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
    this.hungerBar = new GlassLab.FillBar(this.game, 250, 50 / info.desiredFood.length, hungerBarSections);
    this.sprite.addChild(this.hungerBar.sprite);
    this.hungerBar.sprite.visible = false;

    this.thoughtBubble = new GlassLab.ThoughtBubble(this.game);
    this.thoughtBubble.position.setTo(-100, -225);
    this.thoughtBubble.scale.setTo(0.8/this.sprite.scale.x, 0.8/this.sprite.scale.y);
    this.sprite.addChild(this.thoughtBubble);

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.targetFood = []; // tracks the food we want to eat next while we're eating food in a pen. Each food is like {food: f, eatPartially: true}

    this.shadow = this.game.make.sprite(0, 0, "shadow");
    this.sprite.addChild(this.shadow);
    this.shadow.anchor.setTo(0.5, 0.8);
    this.shadow.scale.setTo(0.5, 0.5);

    this.animSprites = {};
    var animNames = ["idle", "idle_back", "walk", "walk_back", "eat", "vomit", "cry_start", "cry_loop", "cry_end"];
    for (var i = 0; i < animNames.length; i++) {
        var animName = animNames[i];
        var spriteName = info.spriteName + "_" + animName;
        var animSprite = this.game.make.sprite(0, 0, spriteName);

        GLOBAL.resourceManager.preloadResource(spriteName);

        animSprite.anchor.setTo(0.5, 0.8);
        animSprite.animations.add('anim'); // this animation uses the whole spritesheet
        this.sprite.addChild(animSprite);

        if (animName != "idle")
        {
            // TODO: Remove the need for this hack, cry animations have slightly different anchor point
            if (animName == "cry_start" || animName == "cry_loop" || animName == "cry_end")
            {
                animSprite.anchor.setTo(0.5, .71);
            }
            animSprite.visible = false;
        }

        animSprite.tint = info.spriteTint || 0xffffff; // temporary way to distinguish creatures
        this.animSprites[animName] = animSprite;
    }

    this.spriteHeight = this.animSprites.idle.height; // for future reference

    this.hungerBar.sprite.y = -this.spriteHeight * this.sprite.scale.y * this.sprite.anchor.y - 270;

    //game.physics.isoArcade.enable(this.sprite);
    this.sprite.events.onDestroy.add(this._onDestroy, this);

    this.targetsChangedHandler = GlassLab.SignalManager.creatureTargetsChanged.add(this._onTargetsChanged, this);
    this.foodDroppedHandler = GlassLab.SignalManager.foodDropped.add(this._onFoodDropped, this);

    // We want the creatures drag/drop vs stickydrag behavior to match UIDraggable, so add one as a component here
    this.draggableComponent = new GlassLab.UIDraggable(this.game);
    this.sprite.addChild(this.draggableComponent);
    var hitArea = new Phaser.Circle(0, -110, 250);
    this.draggableComponent.hitArea = hitArea;
    // uncomment the next line to check the position of the hit area
    //this.draggableComponent.addChild(this.game.make.graphics().beginFill("0xffffff", 0.5).drawCircle(hitArea.x, hitArea.y, hitArea.diameter));
    this.draggableComponent.events.onStartDrag.add(this._startDrag, this);
    this.draggableComponent.events.onEndDrag.add(this._endDrag, this);
    this.draggableComponent.dontMoveWhileDragging = true; // we're just using it to get the start and end drag events

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

    GlassLab.SignalManager.tilePenStateChanged.add(this._onTilePenStateChanged, this);
};

GlassLab.Creature.prototype._onDestroy = function () {
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null;
    this.sprite.events.destroy();
    if (this.updateHandler) this.updateHandler.detach();
    if (this.targetsChangedHandler) this.targetsChangedHandler.detach();
    if (this.foodDroppedHandler) this.foodDroppedHandler.detach();
    if (this.state) this.state.Exit(); // wrap up the current state

    GLOBAL.creatureManager.RemoveCreature(this);
};

GlassLab.Creature.prototype._onTilePenStateChanged = function(tile, pen)
{
    if (!pen)
    {
        return;
    }

    var globalPosition = GlassLab.Util.GetGlobalIsoPosition(this.sprite);
    var currentTile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(globalPosition.x, globalPosition.y);
    // If the tile changed is the same as the tile we're in, we need to move out
    if (currentTile == tile && pen != this.pen)
    {
        if (this.pen)
        {
            // You're screwed, you somehow got edged out of a pen while in a pen
            console.error("Somehow edged away a creature with a pen when it was already in a pen?");
        }

        // Find closest empty tile
        var emptyTile = null;
        var searchDistance = 0; // distance vertically and horizontally away
        var tile = null;
        var mapWidth = GLOBAL.tileManager.GetMapWidth();
        var mapHeight = GLOBAL.tileManager.GetMapHeight();
        // TODO: Mas inefficient
        while (!emptyTile || searchDistance > mapWidth || searchDistance > mapHeight)
        {
            searchDistance++;
            for (var i = -searchDistance; i <= searchDistance; i++)
            {
                tile = GLOBAL.tileManager.GetTile(currentTile.col - searchDistance, currentTile.row+i);
                if (tile && tile.getIsWalkable())
                {
                    emptyTile = tile;
                    break;
                }

                tile = GLOBAL.tileManager.GetTile(currentTile.col + searchDistance, currentTile.row+i);
                if (tile && tile.getIsWalkable())
                {
                    emptyTile = tile;
                    break;
                }

                if (i != -searchDistance && i != searchDistance)
                {
                    tile = GLOBAL.tileManager.GetTile(currentTile.col + i, currentTile.row - searchDistance);
                    if (tile && tile.getIsWalkable())
                    {
                        emptyTile = tile;
                        break;
                    }

                    tile = GLOBAL.tileManager.GetTile(currentTile.col + i, currentTile.row + searchDistance);
                    if (tile && tile.getIsWalkable())
                    {
                        emptyTile = tile;
                        break;
                    }
                }
            }
        }

        if (emptyTile)
        {
            this.moveToTile(emptyTile.col, emptyTile.row);
            this.lookForTargets(); // figure out the nearest target (will go to Traveling, WaitingForFood, or Idle)
        }
        else
        {
            console.error("Creature didn't have an empty tile to get pushed into!")
        }
    }
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
    var tile = GLOBAL.tileManager.getRandomWalkableTile(15); // start around the center

    this.sprite.isoX = tile.isoX;
    this.sprite.isoY = tile.isoY;

    if (Math.random() > 0.5) // face a random direction too
    {
        this.sprite.scale.x *= -1;
    }
};

GlassLab.Creature.prototype.PlayAnim = function (anim, loop, framerate, restart) { // anim should be "walk", "eat", etc. Possibly pull into an enum?
    if (anim == this.currentAnimName && !restart) return this.currentAnim; // no need to change anything
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
            this.currentAnim = animation.animations.play('anim', framerate, loop);
        } else {
            animation.visible = false;
            animation.animations.stop();
        }
    }

    return this.currentAnim;
};

GlassLab.Creature.prototype.StopAnim = function () {
    this.PlayAnim(); // no anim -> stand still
};

GlassLab.Creature.prototype.standFacingPosition = function(targetIsoPos) {
    var pos = GlassLab.Util.GetGlobalIsoPosition(this.sprite);
    var dir;
    if (Math.abs(pos.x - targetIsoPos.x) > Math.abs(pos.y - targetIsoPos.y)) {
        dir = (pos.x < targetIsoPos.x)? "right" : "left";
    } else {
        dir = (pos.y < targetIsoPos.y)? "down" : "up";
    }
    this.standFacing(dir);
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
    this.PathToIsoPosition(goalTile.isoX, goalTile.isoY);
};

GlassLab.Creature.prototype.PathToIsoPosition = function(x, y)
{
    this._clearPath();

    var globalPosition = GlassLab.Util.GetGlobalIsoPosition(this.sprite);
    var start = GLOBAL.tileManager.GetTileIndexAtWorldPosition(globalPosition.x, globalPosition.y);
    var goal = GLOBAL.tileManager.GetTileIndexAtWorldPosition(x, y);
    var path = GLOBAL.astar.findPath(start, goal, null, this.type);

    if (path.nodes.length > 0)
    {
        var pathDelta = GlassLab.Util.POINT2.setTo(0,0);
        this.currentPath.push(path.nodes[0]);

        for (var i=1; i < path.nodes.length; i++)
        {
            // Compare heading with last node's heading
            var node = path.nodes[i];
            var lastNode = this.currentPath[this.currentPath.length-1];
            var dX = node.x - lastNode.x;
            var dY = node.y - lastNode.y;
            if (dX == pathDelta.x && dY == pathDelta.y) // Same direction
            {
                // Modify last node to simplify path
                lastNode.setTo(node.x, node.y);
            }
            else // Different direction
            {
                // Add new node
                pathDelta.setTo(dX, dY);
                this.currentPath.push(new Phaser.Point(node.x, node.y));
            }
        }

        if (GLOBAL.debug) {
            for (var i=this.currentPath.length-1; i >= 0; i--)
            {
                var tile = GLOBAL.tileManager.GetTile(this.currentPath[i].x, this.currentPath[i].y);
                tile.tint = 0xFF0000;
            }
        }

    }

    this.onPathChanged.dispatch(this);
};

GlassLab.Creature.prototype._startDrag = function () {
    this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
    if (this.pen) this.exitPen(this.pen);
    this.currentPath = [];
    this.targetPosition.x = Number.NaN;
    GlassLab.SignalManager.creatureTargetsChanged.dispatch();
};

GlassLab.Creature.prototype._endDrag = function () {
    this.lookForTargets(); // figure out the nearest target (will go to Traveling, WaitingForFood, or Idle)
};

GlassLab.Creature.prototype.OnStickyDrop = function () { // called by (atm) prototype.js
    this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function (dt) {
    if (this.state) this.state.Update(dt);

};

GlassLab.Creature.prototype._setNextTargetPosition = function()
{
    if (this.currentPath.length > 0)
    {
        var tileIndex = this.currentPath.pop();
        var tile = GLOBAL.tileManager.GetTile(tileIndex.x, tileIndex.y);

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

        GLOBAL.tileManager.GetTileWorldPosition(tileIndex.x, tileIndex.y, this.targetPosition); // Set target position to target tile position
        // Offset position slightly
        //this.targetPosition.x += .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize;
        //this.targetPosition.y += .75*(Math.random() - .5)*GLOBAL.tileManager.tileSize;
        GlassLab.Util.GetLocalIsoPosition(this.sprite, this.targetPosition, this.targetPosition.x, this.targetPosition.y);

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
    if (isNaN(this.targetPosition.x) && !this._setNextTargetPosition())
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
            this.targetPosition.x = Number.NaN;

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
            var globalPos = GlassLab.Util.POINT2;
            GlassLab.Util.GetGlobalIsoPosition(this.sprite, globalPos);
            var tile = GLOBAL.tileManager.GetTileAtIsoWorldPosition(globalPos.x, globalPos.y);
            tile.tint = 0xffffff;
        }
    }
};

GlassLab.Creature.prototype.tryWalkToNextFood = function () {
    var foodInfo = this.targetFood.shift();
    if (!foodInfo || !foodInfo.food) {
        if (this.getIsSatisfied()) this.FinishEating("satisfied");
        else this.FinishEating("hungry");
    } else if (!this.desiredAmountsOfFood[foodInfo.food.type]) { // we don't want this food
        this.FinishEating("dislike", foodInfo.food.type);
    } else {
        this.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this, foodInfo));
    }
};

// NOTE: This function assumes creature is in a pen
GlassLab.Creature.prototype.FinishEating = function (result, food) {
    this.hungerBar.show(false);
    if (result == "dislike") {
        this.thoughtBubble.show("redX", food, 2000);
    } else if (result == "satisfied") {
        this.Emote(true);
    } else if (result == "hungry") {
        this.thoughtBubble.show(null, this.getDesiredFood());
        if (this.pen)
        {
            this.StateTransitionTo(new GlassLab.CreatureStateCry(this.game, this, Number.MAX_VALUE));
        }
    }
    // else they would have started vomiting already
    this.pen.SetCreatureFinishedEating(result);
    this.finishedEating = true; // checked by other creatures
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

GlassLab.Creature.prototype.getDesiredFood = function () {
    for (var key in this.foodEaten) {
        if (this.foodEaten[key] + 0.01 < this.desiredAmountsOfFood[key]) return key;
    }
    return null;
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

GlassLab.Creature.prototype.Emote = function (happy, callback) {
    if (happy)
    {
        var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.type);
        GLOBAL.audioManager.playSound(creatureInfo.spriteName+"_sfx_happy");
    }
    var spriteName = (happy) ? "happyEmote" : "angryEmote";
    if (this.emote) this._afterEmote();
    this.emote = this.game.make.sprite(0, 0, spriteName);
    this.emote.scale.setTo(.5, .5);
    this.emote.y = -this.spriteHeight * this.sprite.scale.y;
    var size = this.emote.height * 3; // assumes the height and width are the same
    this.emote.height = this.emote.width = 0;
    this.game.add.tween(this.emote).to({
        y: -2 * this.spriteHeight * this.sprite.scale.y,
        height: size,
        width: size
    }, 100, Phaser.Easing.Linear.Out, true);
    this.emote.anchor.set(0.5, 1);
    this.sprite.addChild(this.emote);
    this.afterEmoteCallback = callback;
    this.game.time.events.add(Phaser.Timer.SECOND * 1, this._afterEmote, this);
};

GlassLab.Creature.prototype._afterEmote = function() {
    if (this.afterEmoteCallback) {
        this.afterEmoteCallback.call(this);
        this.afterEmoteCallback = null;
    }
    if (this.emote) {
        this.emote.destroy();
        this.emote = null;
    }
};

GlassLab.Creature.prototype.ShowHungerBar = function (currentlyEatingAmount, foodType, hideAfter) {
    var amountEaten = this.foodEaten[foodType] + currentlyEatingAmount;
    this.hungerBar.setAmount(foodType, amountEaten / this.desiredAmountsOfFood[foodType], true, hideAfter); // true -> animate change
};

GlassLab.Creature.prototype.HideHungerBar = function () {
    this.hungerBar.sprite.visible = false;
};

GlassLab.Creature.prototype._onFoodDropped = function(food) {
    if (this.state instanceof GlassLab.CreatureStateIdle || this.state instanceof GlassLab.CreatureStateTraveling) {
        var dist = GlassLab.Util.GetGlobalIsoPosition(this.sprite).distance(food.sprite.isoPosition);
        if (dist < 3 * GLOBAL.tileSize) {
            this.StateTransitionTo(new GlassLab.CreatureState()); // do nothing
            this.thoughtBubble.show("exclamationPoint", null, 800, this.lookForTargets, this);
            this.standFacingPosition(food.sprite.isoPosition);
        }
    }
};

GlassLab.Creature.prototype._onTargetsChanged = function() {
    if (this.state instanceof GlassLab.CreatureStateIdle || this.state instanceof GlassLab.CreatureStateTraveling) {
        this.lookForTargets();
    }
};

GlassLab.Creature.prototype.lookForTargets = function () {
    var targets = []; // a list of targets like { pos: world position, pen: pen} or { pos: world position, food: food }
    // Look for pen spots we could enter
    for (var i = 0; i < GLOBAL.penManager.pens.length; i++) {
        targets = targets.concat(GLOBAL.penManager.pens[i].getAvailableSpots(this.type));
        // if this creature type can't enter/doesn't want to enter the pen, no spots will be returned
    }

    // Look for food we could eat
    for (var i = 0; i < GLOBAL.foodInWorld.length; i++) {
        var food = GLOBAL.foodInWorld[i];
        if (food && food.health && !food.eaten && !food.dislikedBy[this.type]) {
            targets = targets.concat(food.getTargets());
        }
    }

    //console.log(this.name,"lookForTargets. Targets:",targets);

    var minDist = null, bestTarget, bestRealDist; // minDist is the best weighted dist so far, but
    for (var i = 0, len = targets.length; i < len; i++) {
        var distSqr = Math.pow((this.sprite.isoX - targets[i].pos.x), 2) + Math.pow((this.sprite.isoY - targets[i].pos.y), 2);
        // now divide the distance by the priority so that targets with higher priority count as closer
        var weightedDistSqr = distSqr;
        if (!isNaN(targets[i].priority)) weightedDistSqr /= (targets[i].priority * targets[i].priority);
        if (minDist == null || weightedDistSqr < minDist) {
            minDist = weightedDistSqr;
            bestTarget = targets[i];
            bestRealDist = distSqr;
        }
    }

    var maxNoticeDist = GLOBAL.tileSize * 190; // so large as to be irrelevant for now
    bestRealDist = Math.sqrt(bestRealDist);
    var targetIsNoticeable = bestRealDist <= maxNoticeDist;
    var targetIsSameTile = bestRealDist <= GLOBAL.tileSize / 2;

    if (bestTarget && targetIsNoticeable) {
        if (bestTarget.pen && !bestTarget.full && !this.getIsEmpty()) { // if the creature wants to enter a pen, it vomits first ...
            this.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this)); // this will look for a target again when it's done
        } else if (!targetIsSameTile || !this.tryReachTarget(bestTarget)) { // if we're too far, or we fail to enter the target right now
            this.StateTransitionTo(new GlassLab.CreatureStateTraveling(this.game, this, bestTarget)); // travel to the target
        } // else we must be close enough and have reached the target
    } else {
        this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
    }

};

GlassLab.Creature.prototype.tryReachTarget = function(target) {
    if (target.pen) {
        if (!this.tryEnterPen(target.pen)) { // try to enter the pen, but if we can't (someone else is there):
            this.Emote(false); // emote sad that we can't enter the pen
            // Next frame, make sure they're facing the spot they want to go (we have to wait since finding the destination might still be wrapping up)
            this.game.time.events.add(0, function() {
                this.standFacingPosition(new Phaser.Point(target.pos.x + GLOBAL.tileSize, target.pos.y)); // add a tile here since we offset the position when we set the target in FeedingPen
            }, this);
        }
        return true; // either way, we reached the target
    } else if (target.food) { // we're on top of some food
        if (target.food.type in this.desiredAmountsOfFood) {
            this.eatFreeFood(target.food);
        } else {
            this.dislikeFood(target.food);
        }
        return true;
    }
    return false;
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

    food.eaten = true;
    GlassLab.SignalManager.creatureTargetsChanged.dispatch(); // since this food is gone
};

GlassLab.Creature.prototype.dislikeFood = function (food) {
    this.StateTransitionTo(new GlassLab.CreatureState()); // do nothing while emoting
    this.thoughtBubble.show("redX", GlassLab.FoodTypes[food.type].spriteName, 1000, this.lookForTargets, this);
    this.standFacingPosition(food.sprite.isoPosition);

    food.dislikedBy[this.type] = true;
    GlassLab.SignalManager.creatureTargetsChanged.dispatch(); // since this food was just disliked
};

GlassLab.Creature.prototype.tryEnterPen = function (pen) {
    //console.log(this.name,"trying to enter pen");
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
    //console.log(this.name,"trying to leave pen.");
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
    this.targetPosition.x = Number.NaN;
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
    var isoPosition = GlassLab.Util.GetGlobalIsoPosition(this.sprite, GlassLab.Util.POINT2);
    return GLOBAL.tileManager.GetTileAtIsoWorldPosition(isoPosition.x, isoPosition.y);
};