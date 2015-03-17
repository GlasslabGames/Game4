/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LevelManager = function(game)
{
    this.game = game;
    this.currentLevel = -1; //GLOBAL.saveManager.LoadData("currentLevel") || -1;
    var queryLevel = getParameterByName("level");
    if (queryLevel != "")
    {
        this.currentLevel = parseInt(queryLevel)-2;
    }

    this.levels = [];

    var level0 = this._addLevelData(new GlassLab.Level());
    level0.data = {
        quest: "alpha1"
    };
    var level01 = this._addLevelData(new GlassLab.Level());
    level01.data = {
        quest: "alpha2"
    };
    var level02 = this._addLevelData(new GlassLab.Level());
    level02.data = {
        quest: "alpha3"
    };
    var level03 = this._addLevelData(new GlassLab.Level());
    level03.data = {
        quest: "alpha4"
    };

    // TESTING LEVELS:
    // 5
    this._addLevelData(new GlassLab.Level()).data = {
      pens: [
        {type: "baby_unifox", height: 1, foodAWidth: 1,
            bottomDraggable: true, leftDraggable: true, topDraggable: true}
      ],
      looseCreatures: {
          baby_unifox: 3,
          baby_rammus: 3,
          unifox: 3,
          rammus: 3

      },
        objective: "Feed the ram!"
    };

    // 6
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
                "client": "Archibold Huxley III",
                "company": "Rupture Farms",
                //"numCreatures": 12,
                "numFoodA": 4,
                "type": "baby_unifox",
                "description": "Dear Friend! I have space for 48 STRAWBERRIES. Can you send me ENOUGH UNIFOXES to eat that much food?",
                "fulfilled": false,
                "reward": 200
            },
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
                type: "baby_rammus",
                description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
                fulfilled: false,
                reward: 200
            }
        ]
    };

    // 8
    this._addLevelData(new GlassLab.Level()).data = {
        pens: [
            {type: "baby_unifox", foodBWidth: 1, bottomDraggable: true, leftDraggable: true, topDraggable: true}
        ],
        looseCreatures: {
            baby_unifox: 1,
            baby_rammus: 1,
            unifox: 1
        },
        objective: "Feed the rams!"
    };

    // 9
    this._addLevelData(new GlassLab.Level()).data = {};

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
        if (typeof this.currentLevel != "undefined" && this.currentLevel > -1) {
            GlassLabSDK.saveTelemEvent("finish_day", {day: this.currentLevel + 1});

            GlassLabSDK.endSessionAndFlush(function(data){
                console.log("Session ended: "+data);
            }.bind(this), function(data) {
                console.log("Session end failed: "+data);
            }.bind(this));
        }

        GlassLabSDK.startSession(function(data){
            console.log("Session started: "+data);
        }.bind(this), function(data) {
            console.log("Session start failed: "+data);
        }.bind(this));

        console.log("Starting level", levelNum, this.levels[levelNum].data);
        this.currentLevel = levelNum;

        GlassLabSDK.saveTelemEvent("start_day", {day: this.currentLevel + 1});

        this.LoadLevelFromData(this.levels[levelNum].data);
    }
    else
    {
        console.error("Could not find requested level number: "+ levelNum);
        console.log("Loading last level...");
        this.LoadLevel(this.levels.length-1);
    }
};

GlassLab.LevelManager.prototype.LoadLevelFromData = function(levelData)
{
    this._destroyCurrentLevel();

    if (levelData.pens) {
        for (var i = 0; i < levelData.pens.length; i++) {
            var penData = levelData.pens[i];
            GLOBAL.penManager.CreatePen(penData);
        }
    }

    if (levelData.looseCreatures) {
        for (var type in levelData.looseCreatures) {
            for (var j = 0; j < levelData.looseCreatures[type]; j++) {
                var creature = new GlassLab.Creature(this.game, type);
                GLOBAL.creatureLayer.add(creature.sprite);
                creature.moveToRandomTile();
                creature.lookForTargets();
                creature.name = "creature"+j; // for debugging
            }
        }
    }

    if (levelData.orders)
    {
        GLOBAL.mailManager.AddOrders.apply(GLOBAL.mailManager, levelData.orders);
    }

    if (typeof levelData.quest != 'undefined')
    {
        var quest = GLOBAL.questManager.questsByName[levelData.quest];
        if (quest.isStarted)
        {
            quest.Reset();
        }

        quest.Start();
    } else {
        GLOBAL.inventoryManager.unlockAll(); // for testing
    }

    if (typeof levelData.objective != 'undefined')
    {
        GLOBAL.questManager.UpdateObjective(levelData.objective);
    }

    GLOBAL.saveManager.SaveData("currentLevel", this.currentLevel);

    // TODO: HACK
    var level = new GlassLab.Level();
    level.data = levelData;
    GlassLab.SignalManager.levelLoaded.dispatch(level);
};

GlassLab.LevelManager.prototype._destroyCurrentLevel = function()
{
    GLOBAL.penManager.DestroyAllPens();

    GLOBAL.creatureManager.DestroyAllCreatures();

    GLOBAL.tileManager.clearTiles();

    GLOBAL.orderFulfillment.pen = null; // clear the reference to the pen

    GLOBAL.inventoryMenu.Hide(true);
};

GlassLab.LevelManager.prototype.LoadNextLevel = function()
{
    this.LoadLevel(this.currentLevel+1);
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