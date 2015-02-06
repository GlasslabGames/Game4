/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LevelManager = function(game)
{
    this.game = game;
    this.currentLevel = -1;
    var queryLevel = getParameterByName("level");
    if (queryLevel != "")
    {
        this.currentLevel = parseInt(queryLevel)-2;
    }
    this.levels = [];
/* TESTING 2-section pen
  var level4 = this._addLevelData(new GlassLab.Level());
  level4.data = {
    pens: [
      {type: "rammus", height: 3, foodAWidth: 2, foodBWidth:2, bottomDraggable: true, leftDraggable: true, topDraggable: true}
    ],
    looseCreatures: {
      rammus: 6
    },
    objective: "Feed as many rams as you can!"
  };
*/
    var level1 = this._addLevelData(new GlassLab.Level());
    level1.data = {
      pens: [
        {type: "rammus"}
      ],
      looseCreatures: {
        rammus: 1
      },
        objective: "Feed the ram!"
    };

    var level2 = this._addLevelData(new GlassLab.Level());
    level2.data = {
      pens: [
        {type: "rammus", height: 3}
      ],
      looseCreatures: {
        rammus: 3
      },
        objective: "Feed all the rams!"
    };

    var level3 = this._addLevelData(new GlassLab.Level());
    level3.data = {
      orders: [
        {
            numCreatures: 7,
            type: "rammus",
            description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!"
        }
      ],
      looseCreatures: {
        rammus: 0
      },
        objective: "Fill an order!"
    };

    var level4 = this._addLevelData(new GlassLab.Level());
        level4.data = {
        pens: [
            {type: "rammus", bottomDraggable: true, leftDraggable: true, topDraggable: true}
        ],
        looseCreatures: {
            rammus: 30
        },
            objective: "Feed as many rams as you can!"
    };
};

GlassLab.LevelManager.prototype._addLevelData = function(levelData)
{
    levelData.id = this.levels.length;
    this.levels.push(levelData);
    return levelData;
};

GlassLab.LevelManager.prototype.LoadLevel = function(levelNum)
{
    if (levelNum < this.levels.length)
    {
        console.log("Starting level", levelNum, this.levels[levelNum].data);
        this._destroyCurrentLevel();
        var data = this.levels[levelNum].data;
        if (data.pens) {
          for (var i = 0; i < data.pens.length; i++) {
            var penData = data.pens[i];
            var widths = [(penData.creatureWidth || 1), (penData.foodWidth || penData.foodAWidth || 1)];
            if (penData.foodBWidth) widths.push(penData.foodBWidth);
            console.log(widths);
            var pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, (penData.height || 1),
              widths, penData.autoFill);
            pen.creatureType = penData.type;
            // set which edges are adjustable here (defaults to the right side only)
            if (penData.leftDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.left, true);
            if (penData.bottomDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.bottom, true);
            if (penData.topDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.top, true);
          }
        }
        if (data.looseCreatures) {
          for (var type in data.looseCreatures) {
            for (var j = 0; j < data.looseCreatures[type]; j++) {
              var creature = new GlassLab.Creature(this.game, type);
              GLOBAL.creatureLayer.add(creature.sprite);
              creature.moveToRandomTile();
              console.log("calling targets changed from levelM")
              creature._onTargetsChanged();
            }
          }
        }

        GlassLab.SignalManager.levelLoaded.dispatch(this.levels[levelNum]);
    }
    else
    {
        console.error("Could not find requested level number: "+ levelNum);
        console.log("Loading last level...");
        this.LoadLevel(this.levels.length-1);
    }
};

GlassLab.LevelManager.prototype._destroyCurrentLevel = function()
{
  // For now just destroy all sprites on the pen and creature layers.
  for (var i = GLOBAL.penLayer.children.length-1; i>=0; i--) {
    GLOBAL.penLayer.getChildAt(i).destroy();
  }
  for (var i = GLOBAL.creatureLayer.children.length-1; i>=0; i--) {
    GLOBAL.creatureLayer.getChildAt(i).destroy();
  }
  GLOBAL.tileManager.clearTiles();
};

GlassLab.LevelManager.prototype.LoadNextLevel = function()
{
    this.LoadLevel(++this.currentLevel);
};

GlassLab.LevelManager.prototype.RestartLevel = function()
{
  this.LoadLevel(this.currentLevel);
};

GlassLab.LevelManager.prototype.GetCurrentLevel = function()
{
    return this.levels[this.currentLevel];
};

GlassLab.LevelManager.prototype.CompleteCurrentLevel = function()
{
    return this.GetCurrentLevel().isCompleted = true;
};

/**
 * Level
 */

GlassLab.Level = function()
{
    this.id = -1;
    this.isCompleted = false;
    this.data = {}; // TODO: fill
};