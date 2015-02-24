/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LevelManager = function(game)
{
    this.game = game;
    this.currentLevel = GLOBAL.saveManager.LoadData("currentLevel") || -1;
    var queryLevel = getParameterByName("level");
    if (queryLevel != "")
    {
        this.currentLevel = parseInt(queryLevel)-2;
    }

    this.levels = [];

    var level0 = this._addLevelData(new GlassLab.Level());
    level0.data = {
        quest: "Alpha"
    };

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
              client: "Archibold Huxley III",
              company: "Rupture Farms",
              numCreatures: 7,
              type: "rammus",
              description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
              fulfilled: false,
              reward: 200
          },
          {
              client: "Archibold Huxley IV",
              company: "Rupture Farms II",
              numCreatures: 48,
              type: "rammus",
              description: "Dear Friend! I must defeat Archibold Huxley III. My island has 48 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
              fulfilled: false,
              reward: 5000
          },
          {
              client: "Ram",
              company: "Baaa",
              numCreatures: 1,
              type: "rammus",
              description: "Dear Friend! My island has 1 RAM. I have heard you know HOW MANY CARROTS I need FOR IT. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
              fulfilled: false,
              reward: -5
          }
      ],
      looseCreatures: {
        rammus: 0
      },
        objective: "Fill an order!"
    };

    this._addLevelData(new GlassLab.Level()).data = {
        objective: "Feed the foxes with multiple kinds of food!",
        pens: [
            {
                type: "unifox", height: 1, foodAWidth: 1, foodBWidth: 1,
                bottomDraggable: true, leftDraggable: true, topDraggable: true
            }
        ],
        looseCreatures: {
            unifox: 6,
            rammus: 3
        }
    };

    this._addLevelData(new GlassLab.Level()).data = {
        objective: "Fill an order!",
        orders: [
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                numCreatures: 5,
                type: "unifox",
                description: "Dear Friend! I want 5 UNIFOXES. But I also need ENOUGH FOOD to keep them all satisfied during the journey.",
                fulfilled: false,
                reward: 200
            },
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                numCreatures: 7,
                type: "rammus",
                description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
                fulfilled: false,
                reward: 200
            }
        ]
    };

    var level6 = this._addLevelData(new GlassLab.Level());
    level6.data = {
        pens: [
            {type: "rammus", bottomDraggable: true, leftDraggable: true, topDraggable: true}
        ],
        looseCreatures: {
            rammus: 30
        },
        objective: "Feed as many rams as you can!"
    };

    var level7 = this._addLevelData(new GlassLab.Level());
    level7.data = {
        quest: "Vertical Slice"
    };

    // level 8
    this._addLevelData(new GlassLab.Level()).data = {
        pens: [
            {type: "rammus2", foodAWidth: 1, foodBWidth:1, bottomDraggable: true, leftDraggable: true, topDraggable: true}
        ],
        looseCreatures: {
            rammus2: 16
        },
        objective: "Feed the rams!"
    };

    // Add Bonus Game data here for now
    this.bonusIndex = -1;
    this.bonusData = [
        [
            { creatureType: "rammus", numCreatures: 1, numFood: 4, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 1, numFood: 2, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 1, numFood: 3, displayMode: "spritesOnly"}
        ],
        [
            { creatureType: "rammus", numCreatures: 1, numFood: 3, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 1, numFood: 4, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 2, numFood: 2, displayMode: "spritesOnly"}
        ],
        [
            { creatureType: "rammus", numCreatures: 2, numFood: 4, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 3, numFood: 2, displayMode: "spritesOnly"},
            { creatureType: "rammus", numCreatures: 2, numFood: 3, displayMode: "spritesOnly"}
        ]
    ];

    // When we finish a bonus game, continue to the next level
    //GlassLab.SignalManager.bonusGameComplete.add(this.LoadNextLevel, this);
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
                GLOBAL.penManager.CreatePen(penData);
            }
        }

        if (data.looseCreatures) {
          for (var type in data.looseCreatures) {
            for (var j = 0; j < data.looseCreatures[type]; j++) {
              var creature = new GlassLab.Creature(this.game, type);
              GLOBAL.creatureLayer.add(creature.sprite);
              creature.moveToRandomTile();
              creature._onTargetsChanged();
            }
          }
        }

        if (data.orders)
        {
            GLOBAL.mailManager.AddOrders.apply(GLOBAL.mailManager, data.orders);
        }

        if (typeof data.quest != 'undefined')
        {
            var quest = GLOBAL.questManager.questsByName[data.quest];
            if (quest.isStarted)
            {
                quest.Reset();
            }

            quest.Start();
        }

        if (typeof data.objective != 'undefined')
        {
            GLOBAL.questManager.UpdateObjective(data.objective);
        }

        GLOBAL.saveManager.SaveData("currentLevel", this.currentLevel);

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
    GLOBAL.penManager.DestroyAllPens();

    GLOBAL.creatureManager.DestroyAllCreatures();

    GLOBAL.tileManager.clearTiles();

    GLOBAL.orderFulfillment.pen = null; // clear the reference to the pen
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
    var level = this.GetCurrentLevel();
    var type = typeof level.data.quest;
    if ((typeof level.data.quest) != 'undefined')
    {
        return false;
    }

    this.GetCurrentLevel().isCompleted = true;

    GlassLab.SignalManager.levelWon.dispatch();
};

GlassLab.LevelManager.prototype.LoadNextBonusGame = function() {
    if (this.bonusIndex < this.bonusData.length - 1) this.bonusIndex++; // else stay on the last one
    var data = this.bonusData[this.bonusIndex];
    console.log(data);
    GLOBAL.sortingGame.start(data);
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