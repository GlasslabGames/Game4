/**
 * Created by Jerry Fu on 1/23/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.LevelManager = function(game)
{
    this.game = game;
    this.currentLevel = -1;

    this.levels = [];

    this._addLevelData({ quest: "day1" });
    this._addLevelData({ quest: "day2" });
    this._addLevelData({ quest: "day3" });
    this._addLevelData({ quest: "day4" });
    this._addLevelData({ quest: "day5" });
    this._addLevelData({ quest: "day6" });
    this._addLevelData({ quest: "day7" });

    // TESTING LEVELS:
    /*/ 6
    this._addLevelData(new GlassLab.Level()).data = {
      pens: [
        {type: "baby_bird",
            creatureWidth: 3, foodAWidth: 4,
            bottomDraggable: true, leftDraggable: true, topDraggable: true}
      ],
      looseCreatures: {
          baby_bird: 3
      },
        objective: "This is a test!"
    };

    // 7
    this._addLevelData(new GlassLab.Level()).data = {
        objective: "This is a test!",
        pens: [
            {
                type: "bird", height: 1, foodAWidth: 1, foodBWidth: 1,
                bottomDraggable: true, leftDraggable: true, topDraggable: true,
                startCol: -9
            }
        ],
        looseCreatures: {
            bird: 4
        }
    };
    */
    // 8
    this._addLevelData(new GlassLab.Level()).data = {
        objective: "Testing",
        orders: [
            {
                "client": "Archibold Huxley III",
                "company": "Rupture Farms",
                "numFoodA": 6,
                "type": "baby_bird",
                "description": "blah",
                "reward": 200
            },
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                numCreatures: 6,
                type: "unifox",
                description: "Dear Friend! I want 5 UNIFOXES. But I also need ENOUGH FOOD to keep them all satisfied during the journey.",
                reward: 200,
                hint: true
            },
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                totalNumFood: 9,
                type: "rammus",
                description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
                fulfilled: false,
                hint: true,
                reward: 200
            },
            {
                client: "Archibold Huxley III",
                company: "Rupture Farms",
                totalNumFood: 9,
                noFoodEntries: true,
                type: "bird",
                description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
                fulfilled: false,
                hint: true,
                reward: 200
            }
        ]
    };
    
    // 9
    this._addLevelData(new GlassLab.Level()).data = {
        pens: [
            {type: "baby_unifox", foodBWidth: 0, bottomDraggable: true, leftDraggable: true, topDraggable: true}
        ],
        looseCreatures: {
            baby_unifox: 2
        },
        objective: "Testing!"
    };

    // 10
    this._addLevelData(new GlassLab.Level()).data = {looseCreatures: {}};

};

GlassLab.LevelManager.prototype._addLevelData = function(levelData)
{
    if (typeof levelData == 'object') levelData.id = this.levels.length;
    this.levels.push(levelData);
    return levelData;
};

GlassLab.LevelManager.prototype.LoadLevel = function(levelNum)
{
    if (levelNum < this.levels.length)
    {
        //console.log("Starting level", levelNum, this.levels[levelNum], this.levels[levelNum].data);
        this.currentLevel = levelNum;

        var level = this.levels[levelNum];
        if (level.data) level = level.data; // this lets us pass either a Level obj or just the data itself
        this.LoadLevelFromData(level);

        GLOBAL.saveManager.SaveData("currentLevel", this.currentLevel);
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

    var level = new GlassLab.Level();
    level.data = levelData;
    GlassLab.SignalManager.levelStarted.dispatch(level);

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
                //creature.moveToRandomTile();
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
};

GlassLab.LevelManager.prototype._destroyCurrentLevel = function()
{
    GLOBAL.penManager.DestroyAllPens();

    GLOBAL.creatureManager.DestroyAllCreatures();

    GLOBAL.tileManager.clearTiles();

    // It would be nice to pull this functionality into a manager, but we don't have a Food Manager atm. It doesn't belong in TileManager though.
    for (var i = GLOBAL.foodLayer.children.length-1; i>=0; i--) {
        GLOBAL.foodLayer.getChildAt(i).destroy();
    }

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

GlassLab.LevelManager.prototype.LoadFirstLevel = function()
{
    var queryLevel = getParameterByName("level");
    if (queryLevel != "") {
        this.currentLevel = parseInt(queryLevel)-1;
    } else if (GLOBAL.saveManager.HasData("currentLevel")) {
        this.currentLevel = GLOBAL.saveManager.LoadData("currentLevel");
    } else {
        this.currentLevel = 0;
    }
    this.LoadLevel(this.currentLevel);
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