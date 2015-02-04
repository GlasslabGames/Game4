/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LevelManager = function(game)
{
    this.game = game;
    this.currentLevel = -1;
    this.levels = [];

    var level1 = this._addLevelData(new GlassLab.Level());
    level1.data = {
      pens: [
        {type: "rammus", height: 1}
      ],
      looseCreatures: {
        rammus: 1
      }
    };

    var level2 = this._addLevelData(new GlassLab.Level());
    level2.data = {
      pens: [
        {type: "rammus", height: 3}
      ],
      looseCreatures: {
        rammus: 3
      }
    };

    var level3 = this._addLevelData(new GlassLab.Level());
    level3.data = {
      orders: [
        {
            numCreatures: 7,
            type: "rammus",
            description: "Etiam nec leo eu felis porta ornare. Proin ultricies enim sit amet mauris pulvinar, nec bibendum augue 7 Rammus. Cum sociis natos que penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi eu arcu sit amet diam placerat porta vitae."
        }
      ],
      looseCreatures: {
        rammus: 0
      }
    };

    var level4 = this._addLevelData(new GlassLab.Level());
      level4.data = {
        pens: [
          {type: "rammus", bottomDraggable: true, leftDraggable: true, topDraggable: false} // TODO; fix issues
        ],
        looseCreatures: {
          rammus: 30
        }
      };

    //this.levels.push(level1, level2, level3);
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
        if (data.looseCreatures) {
          for (var type in data.looseCreatures) {
            for (var j = 0; j < data.looseCreatures[type]; j++) {
              var creature = new GlassLab.Creature(this.game, type);
              GLOBAL.creatureLayer.add(creature.sprite);
              creature.moveToRandomTile();
            }
          }
        }
        if (data.pens) {
          for (var i = 0; i < data.pens.length; i++) {
            var penData = data.pens[i];
            var pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, (penData.leftWidth || 1),
              (penData.rightWidth || 1), (penData.height || 1));
            pen.creatureType = penData.type;
            // set which edges are adjustable here (defaults to the right side only)
            if (penData.leftDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.left, true);
            if (penData.bottomDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.bottom, true);
            if (penData.topDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.top, true);
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