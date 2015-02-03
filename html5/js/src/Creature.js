/**
 * Created by Jerry Fu on 12/17/2014.
 */

var GlassLab = GlassLab || {};


/**
 * CreatureManager
 */
GlassLab.CreatureManager = function(game)
{
    this.game = game;
    GLOBAL.creatureManager = this;
    this.creatureList = [ "rammus", "unifox" ]; // list of creatures in the order they should appear in the journal
    // TODO: update the creatureList when creatures are unlocked or change how pages in the journal work
    this.creatureDatabase = {
        rammus: {
            journalInfo: {
              name: "Rammus Jerkum",
              temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            desiredFoodType: "carrot",
            desiredAmount: 3,
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        },
        unifox: {
            journalInfo: {
              name: "Vulpes Unicornum",
              temperament: "Shy"
            },
            unlocked: true,
            spriteName: "fox",
            desiredFoodType: "carrot",
            desiredAmount: 5,
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
GlassLab.CreatureManager.prototype.LogNumCreaturesFed = function(type, num)
{
    var creatureData = this.creatureDatabase[type];
    if (creatureData.discoveredFoodCounts[num])
    {
        return;
    }
    else
    {
        creatureData.discoveredFoodCounts[num] = "new"; // set it to "new" for now so we know it was just added
    }
};

// For all the discovered food counts that are set to "new", remove that new flag
GlassLab.CreatureManager.prototype.UnflagDiscoveredFoodCounts = function() {
  for (var creatureType in this.creatureDatabase) {
    var discoveredFoodCounts = this.creatureDatabase[creatureType].discoveredFoodCounts;
    for (var index in discoveredFoodCounts) {
      if (discoveredFoodCounts[index] == "new") {
        discoveredFoodCounts[index] = true; // erase the new, but make sure it's still marked as discovered
      }
    }
  }
};

GlassLab.CreatureManager.prototype.GetCreatureData = function(type)
{
    return this.creatureDatabase[type];
};

/**
 * Creature
 */
GlassLab.Creature = function(game, type, initialStateName)
{
  this.type = type;
  var info = GLOBAL.creatureManager.creatureDatabase[type];
  this.sprite = game.make.isoSprite();

  //this.sprite = game.make.sprite(0,0, typeName);
  this.game = game;
  this.state = null;

  if (initialStateName == "WaitingForFood") {
    this.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(game, this));
  } else {
    this.StateTransitionTo(new GlassLab.CreatureStateIdle(game, this));
  }

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

  this.desiredAmountOfFood = info.desiredAmount;
  this.foodEaten = 0;

  this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

  this.targetFood = []; // tracks the food we want to eat next while we're eating food in a pen

  this.hungerBar = new GlassLab.FillBar(this.game);
  this.sprite.addChild(this.hungerBar.sprite);
  this.hungerBar.sprite.visible = false;

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

  this.hungerBar.sprite.y = - this.spriteHeight * this.sprite.scale.y * 4;

//game.physics.isoArcade.enable(this.sprite);
  //this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  this.sprite.events.onDestroy.add(this._onDestroy, this);
};

GlassLab.Creature.prototype._onDestroy = function() {
  if (GLOBAL.dragTarget == this) GLOBAL.dragTarget = null;
  this.sprite.events.destroy();
  if (this.updateHandler) this.updateHandler.detach();
  if (this.state) this.state.Exit(); // wrap up the current state
};

GlassLab.Creature.prototype.print = function()
{
  var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
  var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
  return "Creature("+col+", "+row+")";
};

GlassLab.Creature.prototype.moveToRandomTile = function() {
  var tile = GLOBAL.tileManager.getRandomWalkableTile();

  this.sprite.isoX = tile.isoX;
  this.sprite.isoY = tile.isoY;

  if (Math.random() > 0.5) // face a random direction too
  {
    this.sprite.scale.x *= -1;
  }
};

GlassLab.Creature.prototype.PlayAnim = function(anim, loop, framerate) { // anim should be "walk", "eat", etc. Possibly pull into an enum?
  if (anim == this.currentAnimName) return; // no need to do anything
  var spriteName = GLOBAL.creatureManager.creatureDatabase[this.type].spriteName;

  if (anim) this.facingBack = anim.indexOf("back") > -1; // remember if we're facing back for next time
  else anim = "idle" + (this.facingBack? "_back" : ""); // no anim = idle (facing back if we had been before)
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

GlassLab.Creature.prototype.StopAnim = function() {
  this.PlayAnim(); // no anim -> stand still
};

GlassLab.Creature.prototype._onUp = function(sprite, pointer)
{
  if (this.draggable && GLOBAL.stickyMode && !GLOBAL.dragTarget && !GLOBAL.justDropped) {
    this._startDrag();
  } else if (!GLOBAL.stickyMode && GLOBAL.dragTarget == this) {
    this._endDrag();
  }
};

GlassLab.Creature.prototype._onDown = function(sprite, pointer)
{
  if (!GLOBAL.stickyMode && this.draggable && !GLOBAL.dragTarget) {
    this._startDrag();
  }
};


GlassLab.Creature.prototype._startDrag = function() {
  if (GLOBAL.dragTarget != null) return;
  this.PlayAnim('walk', true, 192);
  this.shadow.y = 150;
  this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
  GLOBAL.dragTarget = this;
};

GlassLab.Creature.prototype._endDrag = function() {
  this.StopAnim();
  //var offset = (); // offset by the shadow position
  this.shadow.y = 0;
  this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
  GLOBAL.dragTarget = null;

  var tile = GLOBAL.tileManager.GetTileAtWorldPosition(this.sprite.isoX, this.sprite.isoY);
  this.sprite.isoX = tile.isoX;
  this.sprite.isoY = tile.isoY;
};

GlassLab.Creature.prototype.OnStickyDrop = function() { // called by (atm) prototype.js
  this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function() {
  if (this.state) this.state.Update();

  if (this.prevIsoPos.x != this.sprite.isoX || this.prevIsoPos.y != this.sprite.isoY) {
    this.prevIsoPos.x = this.sprite.isoX;
    this.prevIsoPos.y = this.sprite.isoY;
    var tile = GLOBAL.tileManager.GetTileAtWorldPosition(this.sprite.isoX, this.sprite.isoY);
    if (this.prevTile != tile) {
      if (this.prevTile) this.prevTile.onCreatureExit(this);
      tile.onCreatureEnter(this);
      this.prevTile = tile;
    }
  }
  //if (this.rightKey.justDown) { }
};

GlassLab.Creature.prototype.FinishEating = function(satisfied) {
  this.hungerBar.show(false);
  if (satisfied) {
    this.pen.SetCreatureFinishedEating(true);
    this.Emote(true);
  } else {
    this.pen.FinishFeeding(false);
    this.Emote(false);
  }
};

GlassLab.Creature.prototype.Emote = function(happy) {
  var spriteName = (happy)? "happyEmote" : "angryEmote";
  this.emote = this.game.make.sprite(0,0, spriteName);
  this.emote.y = - 2 * this.spriteHeight * this.sprite.scale.y;
  var size = this.emote.height * 3; // assumes the height and width are the same
  this.emote.height = this.emote.width = 0;
  this.game.add.tween(this.emote).to( {y: -3 * this.spriteHeight * this.sprite.scale.y, height: size, width: size}, 100, Phaser.Easing.Linear.Out, true);
  this.emote.anchor.set(0.5, 1);
  this.sprite.addChild(this.emote);
};

GlassLab.Creature.prototype.ShowHungerBar = function(currentlyEating) {
  var amountEaten = (currentlyEating)? this.foodEaten + 1 : this.foodEaten;
  this.hungerBar.Set( amountEaten / this.desiredAmountOfFood, true ); // true -> animate change
};

GlassLab.Creature.prototype.HideHungerBar = function() {
  this.hungerBar.sprite.visible = false;
};

GlassLab.Creature.prototype.StateTransitionTo = function(targetState)
{
    if (targetState == this.state)
    {
        console.warn("Target state was the same as current state, ignoring transition request...");
        console.log(this.state);
        return;
    }

    if (this.state)
    {
        this.state.Exit();
    }

    this.state = targetState;

    if (this.state)
    {
        this.state.Enter();
    }
};

/**
 * CreatureState
 */
GlassLab.CreatureState = function(game, owner)
{
    this.creature = owner;
    this.game = game;
};

GlassLab.CreatureState.prototype.Enter = function() {
  //console.log("Enter");
};

GlassLab.CreatureState.prototype.Exit = function() {
  //console.log("Exit");
};

GlassLab.CreatureState.prototype.Update = function() {};

/**
 * CreatureStateIdle
 */
GlassLab.CreatureStateIdle = function(game, owner)
{
    GlassLab.CreatureState.call(this, game, owner);

    this.targetPosition = new Phaser.Point();
    this.targetIsoPoint = new Phaser.Plugin.Isometric.Point3();
    this.findDestinationTimer = null;
};

GlassLab.CreatureStateIdle.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateIdle.constructor = GlassLab.CreatureStateIdle;

GlassLab.CreatureStateIdle.prototype.Enter = function()
{
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.targetsChangedHandler = GlassLab.SignalManager.creatureTargetsChanged.add(this._onTargetsChanged, this);
    this.findDestinationHandler = this.game.time.events.add(Math.random()*3000 + 2000, this._findNewDestination, this);
    this.creature.draggable = true;
};

GlassLab.CreatureStateIdle.prototype.Exit = function()
{
    GlassLab.CreatureState.prototype.Exit.call(this);

    if (this.findDestinationHandler)
    {
        this.game.time.events.remove(this.findDestinationHandler);
        this.findDestinationHandler = null;
    }
    if (this.targetsChangedHandler) this.targetsChangedHandler.detach();
};

GlassLab.CreatureStateIdle.prototype._findNewDestination = function()
{
  var currentTile = GLOBAL.tileManager.GetTileAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY);

  // Build list of possible movements
  var possibleTiles = [];
  var tile = GLOBAL.tileManager.GetTile(currentTile.col - 1, currentTile.row);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col + 1, currentTile.row);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row - 1);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  tile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row + 1);
  if (tile && tile.getIsWalkable()) possibleTiles.push(tile);

  if (possibleTiles.length > 0) {
    tile = possibleTiles[parseInt(Math.random() * possibleTiles.length)];
  }
  else tile = currentTile; // stay in place

  this.targetPosition.set(tile.isoX, tile.isoY);

  this.findDestinationHandler = null;

  var flip = tile.isoY == this.creature.sprite.isoY;
  //console.log(tile.isoX, tile.isoY, this.creature.sprite.isoX, this.creature.sprite.isoY, flip);
  this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (flip ? -1 : 1);

  if (tile.isoY < this.creature.sprite.isoY || tile.isoX < this.creature.sprite.isoX) this.creature.PlayAnim('walk_back', true);
  else this.creature.PlayAnim('walk', true);

};

GlassLab.CreatureStateIdle.prototype.Update = function()
{
    if (this.findDestinationHandler) return; // still waiting to pick a new destination

    var delta = Phaser.Point.subtract(this.targetPosition, this.creature.sprite.isoPosition);
    if (delta.getMagnitudeSq() > 1) {
      delta.setMagnitude(1);
    }
    else {
      // If the delta magnitude is less than our move speed, we're done after this frame.
      this.creature.StopAnim();
      this.findDestinationHandler = this.game.time.events.add(Math.random() * 3000 + 2000, this._findNewDestination, this);
      // Physics
      if (this.creature.sprite.body) {
        this.creature.sprite.body.velocity.setTo(0, 0);
        return;
      }
    }

    var debugPoint = this.game.iso.project(delta);

    if (this.creature.sprite.body) {
      // Physics
      this.creature.sprite.body.velocity.x = delta.x * 100.0;
      this.creature.sprite.body.velocity.y = delta.y * 100.0;
    }
    else {
      Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);

      //this.creature.sprite.position = delta;
      this.creature.sprite.isoX = delta.x;
      this.creature.sprite.isoY = delta.y;
    }

    debugPoint = this.game.iso.project(this.targetIsoPoint);
    this.creature.debugAILine.setTo(this.creature.sprite.x, this.creature.sprite.y, debugPoint.x, debugPoint.y);
};

GlassLab.CreatureStateIdle.prototype._onTargetsChanged = function() {
  var targets = GLOBAL.tileManager.getTargets(this.creature.type);
  console.log(this.creature.print(), targets);
  var minDist = null, bestTarget;
  for (var i = 0, len = targets.length; i < len; i++) {
    var distSqr = Math.pow((this.creature.sprite.isoX - targets[i].isoX), 2) + Math.pow((this.creature.sprite.isoY - targets[i].isoY), 2);
    if (minDist == null || distSqr < minDist) {
      minDist = distSqr;
      bestTarget = targets[i];
    }
  }
  if (bestTarget) {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateTraveling(this.game, this.creature, bestTarget));
  }
};

/**
 * CreatureStateWaitingForFood
 */
GlassLab.CreatureStateWaitingForFood = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  // Do nothing
};

GlassLab.CreatureStateWaitingForFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWaitingForFood.constructor = GlassLab.CreatureStateWaitingForFood;

GlassLab.CreatureStateWaitingForFood.prototype.StartWalkingToFood = function() {
  var food = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
  if (!food) { // no good. Stop immediately, unsatisfied (unless this creature wanted 0 food?)
    var satisfied = (this.creature.foodEaten == this.creature.desiredAmountOfFood);
    if (satisfied) this.creature.FinishEating(true);
    else {
      console.log(this.creature.print(),"is hungry but has no more food to target (in StartWalking). Eaten:",this.creature.foodEaten,
      "Desired:",this.creature.desiredAmountOfFood);
      this.creature.FinishEating(false);
    }
  } else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, food));
  }
};

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
  GlassLab.CreatureState.call(this, game, owner);
  console.log(this.creature,"dragged");
};

GlassLab.CreatureStateDragged.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateDragged.constructor = GlassLab.CreatureStateDragged;

GlassLab.CreatureStateDragged.prototype.Update = function()
{
  var cursorIsoPosition = new Phaser.Point(this.game.input.activePointer.worldX, this.game.input.activePointer.worldY);
  this.game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
    Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
  this.creature.sprite.isoX = cursorIsoPosition.x;
  this.creature.sprite.isoY = cursorIsoPosition.y;
};


/**
 * CreatureStateWalkingToFood - moving to the next piece of food in the pen
 */
GlassLab.CreatureStateWalkingToFood = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.food = food;
};

GlassLab.CreatureStateWalkingToFood.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateWalkingToFood.constructor = GlassLab.CreatureStateWalkingToFood;

GlassLab.CreatureStateWalkingToFood.prototype.Enter = function()
{
  //console.log(this.creature,"walking to food", this.food);
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.creature.PlayAnim("walk", true);
};

GlassLab.CreatureStateWalkingToFood.prototype.Exit = function()
{
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.creature.StopAnim();
};

GlassLab.CreatureStateWalkingToFood.prototype.Update = function()
{
  var speed = 1.5;
  var delta = Phaser.Point.subtract(this.food.sprite.isoPosition, this.creature.sprite.isoPosition);
  if (delta.getMagnitudeSq() > Math.pow(GLOBAL.tileSize * 0.5, 2)) { // we're far from the carrot
    delta.setMagnitude(speed);
    Phaser.Point.add(this.creature.sprite.isoPosition, delta, delta);
    this.creature.sprite.isoX = delta.x;
    this.creature.sprite.isoY = delta.y;
  }
  else {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateEating(this.game, this.creature, this.food));
  }
};

/**
 * CreatureStateEating - chewing on some food
 */
GlassLab.CreatureStateEating = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  //console.log(this.creature,"eating");
  this.food = food;
};

GlassLab.CreatureStateEating.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateEating.constructor = GlassLab.CreatureStateEating;

GlassLab.CreatureStateEating.prototype.Enter = function()
{
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.anim = this.creature.PlayAnim("eat", false, 48);
  this.chomped = false;
  this.anim.onComplete.addOnce(this.StopEating, this);
};

GlassLab.CreatureStateEating.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateEating.prototype.Update = function() {
  if (!this.chomped && this.anim.frame >= 16) this._onChomp(); // this is the frame index where he chomps
};

GlassLab.CreatureStateEating.prototype._onChomp = function() {
  this.chomped = true;
  this.food.BeEaten();
  this.creature.ShowHungerBar(true);
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
  console.log("Finished eating anim");
  //this.food.sprite.visible = false;
  this.creature.foodEaten ++;

  // Choose which state to go to based on the situation...
  if (this.creature.foodEaten > this.creature.desiredAmountOfFood) {
    this.creature.StateTransitionTo(new GlassLab.CreatureStateVomiting(this.game, this.creature, this.food));
  } else {
    var food = this.creature.targetFood.shift(); //this.creature.pen.GetNextFoodInCreatureRow(this.creature);
    if (food) {
      this.creature.StateTransitionTo(new GlassLab.CreatureStateWalkingToFood(this.game, this.creature, food));
    } else { // there's no more food
      // end the level hungry or satisfied
      this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
      var satisfied = (this.creature.foodEaten == this.creature.desiredAmountOfFood);
      if (satisfied) this.creature.FinishEating(true);
      else {
        console.log(this.creature.print(),"is hungry but has no more food to target (in StopEating.) Eaten:",this.creature.foodEaten,
          "Desired:",this.creature.desiredAmountOfFood);
        this.creature.FinishEating(false);
      }
    }
  }
};

/**
 * CreatureStateVomiting - when it has eaten too much
 */
GlassLab.CreatureStateVomiting = function(game, owner, food)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.food = food;
};

GlassLab.CreatureStateVomiting.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateVomiting.constructor = GlassLab.CreatureStateVomiting;

GlassLab.CreatureStateVomiting.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
  this.anim = this.creature.PlayAnim("vomit", false, 48);
  this.anim.onComplete.addOnce(this._onFinishVomiting, this);
  this.spewed = false;
};

GlassLab.CreatureStateVomiting.prototype.Update = function() {
  if (!this.spewed && this.anim.frame >= 51) this._onSpew(); // this is the frame index where we should start the vomit fx
};

GlassLab.CreatureStateVomiting.prototype._onSpew = function() {
  this.spewed = true;
  var vomit = this.game.make.sprite(-20,-190, "vomit"); //-420,-155
  vomit.anchor.set(1,0);
  vomit.tint = 0xe37f54; // carrot color - if we don't want it so bright, use 0x9dad62
  this.creature.sprite.addChild(vomit); // NOTE: remember to clean this up if we do something except remove the parent
  vomit.animations.add("anim");
  vomit.animations.play("anim", 24, false);
};

GlassLab.CreatureStateVomiting.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStateVomiting.prototype._onFinishVomiting = function() {
  this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
  console.log(this.creature.print(),"ate too much! Eaten:",this.creature.foodEaten, "Desired:",this.creature.desiredAmountOfFood);
  this.creature.FinishEating(false);
};

/**
 * CreatureStateTraveling - when it's heading for a certain target (for now, a target tile, although it could be reworked)
 */
GlassLab.CreatureStateTraveling = function(game, owner, targetTile)
{
  GlassLab.CreatureState.call(this, game, owner);
  this.target = targetTile;
};

GlassLab.CreatureStateTraveling.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateTraveling.constructor = GlassLab.CreatureStateTraveling;

GlassLab.CreatureStateTraveling.prototype.Enter = function() {
  GlassLab.CreatureState.prototype.Enter.call(this);
};

GlassLab.CreatureStateTraveling.prototype.Update = function() {
  if (!this.wayPoint) {
    this.wayPoint = this._getWaypoint();
  }

  var delta = Phaser.Point.subtract(this.wayPoint.isoPosition, this.creature.sprite.isoPosition);
  var moveSpeed = 1.3;
  if (delta.getMagnitudeSq() >= moveSpeed * moveSpeed) { // move in the right direction, but no faster than our move speed
    // Collapse one the smaller direction so we stay on the grid (if they're equal, resolve it randomly)
    if (Math.abs(delta.x) < Math.abs(delta.y) || (Math.abs(delta.x) == Math.abs(delta.y) && Math.random() > 0.5)) delta.x = 0;
    else delta.y = 0;
    delta.setMagnitude( moveSpeed );
    this.creature.sprite.isoX += delta.x;
    this.creature.sprite.isoY += delta.y;

    // Note that the animation won't start if we're already playing it, so this is no problem
    if (delta.y < 0 || delta.x < 0) {
      this.creature.PlayAnim("walk_back", true);
    } else {
      this.creature.PlayAnim("walk", true);
    }
    var flip = (delta.y == 0);
    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (flip ? -1 : 1);
  } else {
    this.creature.StopAnim();
    // If the waypoint is the same as the original target point, stop
    if (Phaser.Point.subtract(this.wayPoint.isoPosition, this.target.isoPosition).getMagnitude() < GLOBAL.tileSize) {
      console.log("Reached target point");
      if (this.target.inPen) {
        console.log(this.target.inPen);
        this.creature.pen = this.target.inPen;
        this.target.inPen.onCreatureEntered();
        this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
      } else {
        this.creature.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this.creature));
      }
    } else {
      this.wayPoint = null; // so we recalculate it next time
    }
  }

};

GlassLab.CreatureStateTraveling.prototype._getWaypoint = function() {
  var delta = Phaser.Point.subtract(this.target.isoPosition, this.creature.sprite.isoPosition);
  var currentTile = GLOBAL.tileManager.GetTileAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY);
  var xTile = GLOBAL.tileManager.GetTile(currentTile.col + (delta.x < 0? -1 : 1), currentTile.row);
  var yTile = GLOBAL.tileManager.GetTile(currentTile.col, currentTile.row + (delta.y < 0? -1 : 1));
  // Go in the y direction if the y diff is larger (or randomly if they're the same), but only if we can walk there
  var preferY = (Math.abs(delta.x) < Math.abs(delta.y) || (Math.abs(delta.x) == Math.abs(delta.y) && Math.random() > 0.5));
  if ((preferY || !xTile.getIsWalkable(this.creature.type)) && yTile.getIsWalkable(this.creature.type)) { // go this way if we prefer it or if the other way is blocked
    return yTile;
  } else if (xTile.getIsWalkable(this.creature.type)) {
    return xTile;
  } else return currentTile; // stay in place for now
};

GlassLab.CreatureStateVomiting.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};