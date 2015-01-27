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
    this.creatureDatabase = {
        rammus: {
            spriteName: "sheep",
            desiredFoodType: "Carrots",
            desiredAmount: 3,
            discoveredFeedCounts: [] // By number of creatures (food is auto-derived)
        },
        bird: {
            desiredFoodType: "Rocks",
            desiredAmount: 5,
            discoveredFeedCounts: [] // By number of creatures (food is auto-derived)
        },
        poopmonster: {
            desiredFoodType: "Poop",
            desiredAmount: .5,
            discoveredFeedCounts: [] // By number of creatures (food is auto-derived)
        }
    };

    this.LogNumCreaturesFed("rammus", 3);
    this.LogNumCreaturesFed("rammus", 1);
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
    if (creatureData.discoveredFeedCounts.indexOf(num) != -1)
    {
        return;
    }
    else
    {
        creatureData.discoveredFeedCounts.push(num);
        creatureData.discoveredFeedCounts.sort();
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
    this.sprite = game.make.isoSprite(0,0,0, info.spriteName);

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

    // TODO: Input handling should be handled outside this class.
    this.sprite.events.onInputUp.add(this._onUp, this);
    this.sprite.events.onInputDown.add(this._onDown, this);
    this.sprite.anchor.setTo(0.5, 0.8);

    this.sprite.scale.x = -0.25;
    this.sprite.scale.y = 0.25;

    this.debugAILine = new Phaser.Line();

    this.desiredAmountOfFood = info.desiredAmount;
    this.foodEaten = 0;

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

    this.targetFood = []; // tracks the food we want to eat next while we're eating food in a pen

    this.hungerBar = new GlassLab.FillBar(this.game);
    this.sprite.addChild(this.hungerBar.sprite);
    this.hungerBar.sprite.y = - this.sprite.height * 3;
    this.hungerBar.sprite.visible = false;

  //game.physics.isoArcade.enable(this.sprite);
    //this.rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
};

GlassLab.Creature.prototype.print = function()
{
  var row = Math.round(this.sprite.isoY / GLOBAL.tileSize);
  var col = Math.round(this.sprite.isoX / GLOBAL.tileSize);
  return "Creature("+col+", "+row+")";
};

GlassLab.Creature.prototype.PlayAnim = function(anim, framerate) { // anim should be "walk", "eat", etc. Possibly pull into an enum?
  var spriteName = GLOBAL.creatureManager.creatureDatabase[this.type].spriteName;
  if (!anim) {
    this.sprite.loadTexture(spriteName);
  } else {
    this.sprite.loadTexture(spriteName+"_"+anim);
    this.sprite.animations.add('anim'); // this animation uses the whole spritesheet
    if (!framerate) framerate = 24;
    this.sprite.animations.play('anim', framerate, true);
  }
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
  this.PlayAnim('walk', 96);
  this.StateTransitionTo(new GlassLab.CreatureStateDragged(this.game, this));
  GLOBAL.dragTarget = this;
};

GlassLab.Creature.prototype._endDrag = function() {
  this.StopAnim();
  this.StateTransitionTo(new GlassLab.CreatureStateIdle(this.game, this));
  GLOBAL.dragTarget = null;
};

GlassLab.Creature.prototype.OnStickyDrop = function() { // called by (atm) prototype.js
  this._endDrag();
};


GlassLab.Creature.prototype._onUpdate = function() {
  if (this.state) this.state.Update();

  //if (this.rightKey.justDown) { }
};

GlassLab.Creature.prototype.FinishEating = function(satisfied) {
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
  this.emote.y = - 2 * this.sprite.height;
  var size = this.emote.height * 3; // assumes the height and width are the same
  this.emote.height = this.emote.width = 0;
  this.game.add.tween(this.emote).to( {y: -3 * this.sprite.height, height: size, width: size}, 100, Phaser.Easing.Linear.Out, true);
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
};

GlassLab.CreatureStateIdle.prototype._findNewDestination = function()
{
    GLOBAL.tileManager.GetTileIndexAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY, this.targetPosition);

    // Build list of possible movements
    var possiblePositions = [];
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x+1, this.targetPosition.y);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x+1, this.targetPosition.y));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x-1, this.targetPosition.y);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x-1, this.targetPosition.y));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x, this.targetPosition.y+1);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x, this.targetPosition.y+1));
    var possiblePos = GLOBAL.tileManager.TryGetTileData(this.targetPosition.x, this.targetPosition.y-1);
    if (GLOBAL.tileManager.IsTileTypeWalkable(possiblePos))
        possiblePositions.push(new Phaser.Point(this.targetPosition.x, this.targetPosition.y-1));

    if (possiblePositions.length > 0) this.targetPosition = possiblePositions[parseInt(Math.random() * possiblePositions.length)];

    if (GLOBAL.tileManager.GetTileData(this.targetPosition.x, this.targetPosition.y) == 0)
    {
        GLOBAL.tileManager.GetTileIndexAtWorldPosition(this.creature.sprite.isoX, this.creature.sprite.isoY, this.targetPosition);
    }

    GLOBAL.tileManager.GetTileWorldPosition(this.targetPosition.x, this.targetPosition.y, this.targetPosition);

    this.targetIsoPoint.setTo(this.targetPosition.x, this.targetPosition.y, 0);

    this.findDestinationHandler = null;

    this.creature.PlayAnim('walk');
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
      this.creature.stopAnim();
      this.findDestinationHandler = this.game.time.events.add(Math.random() * 3000 + 2000, this._findNewDestination, this);
      // Physics
      if (this.creature.sprite.body) {
        this.creature.sprite.body.velocity.setTo(0, 0);
        return;
      }
    }

    var debugPoint = this.game.iso.project(delta);
    this.creature.sprite.scale.x = Math.abs(this.creature.sprite.scale.x) * (debugPoint.x > 0 ? -1 : 1);

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
  this.creature.PlayAnim("walk");
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
  if (delta.getMagnitudeSq() > Math.pow(GLOBAL.tileSize * 0.3, 2)) { // we're far from the carrot
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
  this.startTime = this.game.time.totalElapsedSeconds();
  this.startScaleY = this.creature.sprite.scale.y;
  this.tween = this.game.add.tween(this.creature.sprite.scale).to( {y: this.startScaleY * 0.9 }, 200, Phaser.Easing.Linear.InOut, true, 0, -1, true);
  this.tween2 = this.game.add.tween(this.food.sprite).to( {alpha: 0.1 },
    GlassLab.CreatureStateEating.EATING_TIME * 1000, Phaser.Easing.Linear.None, true);

  this.creature.ShowHungerBar(true); // jk, we don't want the hunger bar while feeding in a pen
};

GlassLab.CreatureStateEating.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.tween.stop();
  this.tween2.stop();
  this.creature.sprite.scale.y = this.startScaleY;

  this.creature.HideHungerBar();
};

GlassLab.CreatureStateEating.EATING_TIME = 1.5; // in secs. This can be replaced by the length of the eating anim maybe

GlassLab.CreatureStateEating.prototype.Update = function()
{
  var timeElapsed = this.game.time.totalElapsedSeconds() - this.startTime;

  if (timeElapsed > GlassLab.CreatureStateEating.EATING_TIME) {
    this.StopEating();
  }
};

GlassLab.CreatureStateEating.prototype.StopEating = function() {
  this.food.sprite.visible = false;
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
  this.startTime = this.game.time.totalElapsedSeconds();
  this.creature.sprite.tint = 0xFFE6E6;
  this.scaleX = this.creature.sprite.scale.x;
  this.tween = this.game.add.tween(this.creature.sprite.scale).to( {x: this.scaleX * 0.85 },
    GlassLab.CreatureStateVomiting.VOMITING_TIME * 250, Phaser.Easing.Default, true, 0, -1, true);
};

GlassLab.CreatureStateVomiting.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
  this.tween.stop();
  this.creature.sprite.scale.x = this.scaleX;
  this.creature.sprite.tint = 0xffffff;
};

GlassLab.CreatureStateVomiting.VOMITING_TIME = 1; // in secs. This can be replaced by the length of the eating anim maybe

GlassLab.CreatureStateVomiting.prototype.Update = function()
{
  var timeElapsed = this.game.time.totalElapsedSeconds() - this.startTime;

  if (timeElapsed > GlassLab.CreatureStateVomiting.VOMITING_TIME) {
    this.food.sprite.visible = true;
    this.food.sprite.alpha = 0.8;
    this.food.sprite.tint = 0xB3FFBD;

    this.creature.StateTransitionTo(new GlassLab.CreatureStateWaitingForFood(this.game, this.creature));
    console.log(this.creature.print(),"ate too much! Eaten:",this.creature.foodEaten, "Desired:",this.creature.desiredAmountOfFood);
    this.creature.FinishEating(false);
  }
};
