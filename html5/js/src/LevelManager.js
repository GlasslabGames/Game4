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
        {height: 1}
      ]
    };

    var level2 = this._addLevelData(new GlassLab.Level());
    level2.data = {
      pens: [
        {height: 3}
      ]
    };

    var level3 = this._addLevelData(new GlassLab.Level());
    level3.data = {
      orders: [
        {numCreatures: 5}
      ]
    };

    this.levels.push(level1, level2, level3);
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
        console.log("Starting level", levelNum);
        this._destroyCurrentLevel();
        var data = this.levels[levelNum].data;
        if (data.pens) {
          for (var i = 0; i < data.pens.length; i++) {
            var penData = data.pens[i];
            var pen = new GlassLab.FeedingPen(this.game, GLOBAL.penLayer, (penData.leftWidth || 1),
              (penData.rightWidth || 1), (penData.height || 1));
            // if we need to, set which edges are adjustable here (defaults to the right side only)
          }
        }
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
  for (var i = 0; i < GLOBAL.penLayer.children.length; i++) {
    GLOBAL.penLayer.getChildAt(i).destroy();
  }
  for (var i = 0; i < GLOBAL.creatureLayer.children.length; i++) {
    GLOBAL.creatureLayer.getChildAt(i).destroy();
  }
};

GlassLab.LevelManager.prototype.LoadNextLevel = function()
{
    this.LoadLevel(++this.currentLevel);
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