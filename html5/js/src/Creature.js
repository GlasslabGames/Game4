/**
 * Created by Jerry Fu on 12/17/2014.
 */

var GlassLab = GlassLab || {};


/**
 * CreatureManager
 */
GlassLab.CreatureManager = function (game) {
    this.game = game;
    GLOBAL.creatureManager = this;
    this.creatureList = ["rammus", "rammus2", "unifox"]; // list of creatures in the order they should appear in the journal
    // TODO: update the creatureList when creatures are unlocked or change how pages in the journal work
    this.creatureDatabase = {
        rammus3: {
            journalInfo: {
                name: "Rammus Jerkum",
                temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            desiredFood: [{type: "carrot", amount: 3}],
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        },
        rammus: {
            journalInfo: {
                name: "Rammus2",
                temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            spriteTint: 0xaaaaff, // for testing
            desiredFood: [{type: "carrot", amount: 3}, {type: "potato", amount: 2}],
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        },
        unifox: {
            journalInfo: {
                name: "Vulpes Unicornum",
                temperament: "Shy"
            },
            unlocked: true,
            spriteName: "fox",
            desiredFood: [{type: "carrot", amount: 5}],
            discoveredFoodCounts: {} // By number of creatures (food is auto-derived)
        }
    };

    //this.LogNumCreaturesFed("rammus", 3);
    //this.LogNumCreaturesFed("rammus", 1);
};

/*
 * CreatureManager.LogNumCreaturesFed - logs the number of creatures successfully fed
 * @param type string, type of creature fed
 * @param num int, number of creatures fed
 * NOTE: Ratio is automatically derived by desired ratio is creature data
 */
GlassLab.CreatureManager.prototype.LogNumCreaturesFed = function (type, num) {
    var creatureData = this.creatureDatabase[type];
    if (creatureData.discoveredFoodCounts[num]) {
        return;
    }
    else {
        creatureData.discoveredFoodCounts[num] = "new"; // set it to "new" for now so we know it was just added
    }
};

// For all the discovered food counts that are set to "new", remove that new flag
GlassLab.CreatureManager.prototype.UnflagDiscoveredFoodCounts = function () {
    for (var creatureType in this.creatureDatabase) {
        var discoveredFoodCounts = this.creatureDatabase[creatureType].discoveredFoodCounts;
        for (var index in discoveredFoodCounts) {
            if (discoveredFoodCounts[index] == "new") {
                discoveredFoodCounts[index] = true; // erase the new, but make sure it's still marked as discovered
            }
        }
    }
};

GlassLab.CreatureManager.prototype.GetCreatureData = function (type) {
    return this.creatureDatabase[type];
};

/**
 * Creature
 */
GlassLab.Creature = function (game, type, initialStateName) {
    this.type = type;
    var info = GLOBAL.creatureManager.creatureDatabase[type];
    this.sprite = game.make.isoSprite();

    //this.sprite = game.make.sprite(0,0, typeName);
    this.game = game;
    this.state = null;

    this.sprite.inputEnabled = true;
    this.sprite.draggable = false; // set this in each state
    this.prevIsoPos = new Phaser.Point();
    this.prevTile = null;

    this.sprite.events.onInputUp.add(this._onUp, this);
    this.sprite.events.onInputDown.add(this._onDown, this);
    //this.sprite.anchor.setTo(0.5, 0.8);

    this.sprite.scale.x = -0.25;
    this.sprite.scale.y = 0.25;

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
    console.log("Hunger bar sections:", hungerBarSections);
    this.hungerBar = new GlassLab.FillBar(this.game, 500, 100, hungerBarSections);
    this.sprite.addChild(this.hungerBar.sprite);
    this.hungerBar.sprite.visible = false;

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.targetFood = []; // tracks the food we want to eat next while we're eating food in a pen

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
        this.animSprites[animNames[i]] = animSprite;
    }

    this.animSprites.idle.visible = true;
    this.spriteHeight = this.animSprites.idle.height; // for future reference

    this.hungerBar.sprite.y = -this.spriteHeight * this.sprite.scale.y * 4;

    //game.physics.isoArcade.enable(this.sprite);
    //this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
    this.sprite.events.onDestroy.add(this._onDestroy, this);

    // FINALLY, start the desired state
    if (initialStateName == "WaitingForFood") {
        this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(game, this));
    } else {
        this.StateTransitionTo(new GlassLab.CreatureStateIdle(game, this));
    }
};

GlassLab.Creature.prototype._onDestroy = function () {
    if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null;
    this.sprite.events.destroy();
    if (this.updateHandler) this.updateHandler.detach();
    if (this.state) this.state.Exit(); // wrap up the current state
};

GlassLab.Creature.prototype.print = function () {
    var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
    var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
    return "Creature(" + col + ", " + row + ")";
};

GlassLab.Creature.prototype.moveToRandomTile = function () {
    var tile = GLOBAL.tileManager.getRandomWalkableTile();

    this.getTile().onCreatureExit(this);
    tile.onCreatureEnter(this);

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

    this.shadow.visible = (anim != "eat" && anim != "vomit");
    if (!framerate) framerate = 72; // ML said 48 but 72 looks better for the walk anims
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
};

GlassLab.Creature.prototype._onDown = function (sprite, pointer) {
    if (!GLOBAL.stickyMode && this.draggable && !GLOBAL.dragTarget) {
        this._startDrag();
    }
};


GlassLab.Creature.prototype._startDrag = function () {
    if (GLOBAL.dragTarget != null) return;
    this.getTile().onCreatureExit(this);
    if (this.pen) {
        this.pen.onCreatureRemoved(this);
        this.pen = null;
    }
    this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
    GLOBAL.dragTarget = this;
};

GlassLab.Creature.prototype._endDrag = function () {
    GLOBAL.dragTarget = null;
    this.getTile().onCreatureEnter(this);
    this._onTargetsChanged(); // figure out the nearest target (will go to Traveling, WaitingForFood, or Idle)
};

GlassLab.Creature.prototype.OnStickyDrop = function () { // called by (atm) prototype.js
    this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function () {
    if (this.state) this.state.Update();

    if (this.prevIsoPos.x != this.sprite.isoX || this.prevIsoPos.y != this.sprite.isoY) {
        this.prevIsoPos.x = this.sprite.isoX;
        this.prevIsoPos.y = this.sprite.isoY;
        if (GLOBAL.dragTarget != this) {
            var tile = this.getTile();
            if (this.prevTile != tile) {
                if (this.prevTile) this.prevTile.onCreatureExit(this);
                tile.onCreatureEnter(this);
                this.prevTile = tile;
            }
        }
    }
    //if (this.rightKey.justDown) { }
};

GlassLab.Creature.prototype.FinishEating = function (satisfied) {
    this.hungerBar.show(false);
    this.Emote(satisfied);

    if (satisfied) {
        this.pen.SetCreatureFinishedEating(true);
    } else {
        this.pen.FinishFeeding(false);
    }
};

GlassLab.Creature.prototype.resetFoodEaten = function () {
    for (var key in this.foodEaten) this.foodEaten[key] = 0;
    this.hungerBar.amount = 0; // TODO: fix for new hunger bar
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

GlassLab.Creature.prototype.ShowHungerBar = function (currentlyEating, foodType, resetVisibility) {
    var amountEaten = (currentlyEating) ? this.foodEaten[foodType] + 1 : this.foodEaten[foodType];
    this.hungerBar.setAmount(foodType, amountEaten / this.desiredAmountsOfFood[foodType], true, resetVisibility); // true -> animate change
    // TODO: reset visibility isn't working
};

GlassLab.Creature.prototype.HideHungerBar = function () {
    this.hungerBar.sprite.visible = false;
};

GlassLab.Creature.prototype._onTargetsChanged = function () {
    var targets = GLOBAL.tileManager.getTargets(this);
    console.log(this.print(), targets);
    var minDist = null, bestTarget; // target is a tile
    for (var i = 0, len = targets.length; i < len; i++) {
        var distSqr = Math.pow((this.sprite.isoX - targets[i].isoX), 2) + Math.pow((this.sprite.isoY - targets[i].isoY), 2);
        if (minDist == null || distSqr < minDist) {
            minDist = distSqr;
            bestTarget = targets[i];
        }
    }

    var maxNoticeDist = GLOBAL.tileSize * 10;
    if (bestTarget == this.getTile()) {
        if (bestTarget.inPen) { // if we're actually in the pen now
            console.log(this.print() + " is in a pen now!", bestTarget, this.getTile());
            this.enterPen(bestTarget.inPen);
            this.setIsoPos(bestTarget.isoX, bestTarget.isoY);
        } else { // assume that we're on top of some food
            console.log(this.print() + " is on top of food now!", bestTarget.food, this.getTile());
            this.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this, bestTarget.food));
        }
    } else if (bestTarget && minDist <= maxNoticeDist * maxNoticeDist) {
        if (this.state instanceof GlassLab.CreatureStateTraveling) { // rather than restarting the traveling state, just set the new target
            this.state.target = bestTarget;
        } else {
            this.StateTransitionTo(new GlassLab.CreatureStateTraveling(this.game, this, bestTarget));
        }
    } else {
        this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
    }
};

GlassLab.Creature.prototype.enterPen = function (pen) {
    this.pen = pen;
    this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this));
    pen.onCreatureEntered(this);
    // this.resetFoodEaten(); // we actually don't want to reset the food eaten, even though it's confusing
};

GlassLab.Creature.prototype.setIsoPos = function (x, y) {
    this.sprite.isoX = x;
    this.sprite.isoY = y;
};

GlassLab.Creature.prototype.StateTransitionTo = function (targetState) {
    if (targetState == this.state) {
        console.warn("Target state was the same as current state, ignoring transition request...");
        console.log(this.state);
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
    return GLOBAL.tileManager.GetTileAtIsoWorldPosition(this.sprite.isoX, this.sprite.isoY);
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

/**
 * CreatureState
 */
GlassLab.CreatureState = function (game, owner) {
    this.creature = owner;
    this.game = game;
};

GlassLab.CreatureState.prototype.Enter = function () {
    //console.log("Enter");
};

GlassLab.CreatureState.prototype.Exit = function () {
    //console.log("Exit");
};

GlassLab.CreatureState.prototype.Update = function () {
};