/**
 * Created by Jerry Fu on 2/18/2015.
 */

var GlassLab = GlassLab || {};

/**
 * CreatureManager
 */
GlassLab.CreatureManager = function (game) {
    this.game = game;
    GLOBAL.creatureManager = this;
    this.creatureList = ["baby_rammus", "rammus", "baby_unifox", "unifox"]; // list of creatures in the order they should appear in the journal
    this.creatureDatabase = {
        baby_rammus: {
            journalInfo: {
                name: "Rammus Jerkum (juvenile)",
                temperament: "Combative"
            },
            displayNames: {
                singular: "baby ram",
                plural: "baby rams"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "babySheep",
            fxFrames: {eat: 14, vomit: 21 },
            desiredFood: [{type: "broccoli", amount: 3}]
        },
        rammus: {
            journalInfo: {
                name: "Rammus Jerkum (adult)",
                temperament: "Combative"
            },
            displayNames: {
                singular: "ram",
                plural: "rams"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "sheep",
            fxFrames: {eat: 16, vomit: 60 },
            desiredFood: [{type: "broccoli", amount: 3}, {type: "tincan", amount: 5}]
        },
        baby_unifox: {
            journalInfo: {
                name: "Vulpes Unicornum (juvenile)",
                temperament: "Shy"
            },
            displayNames: {
                singular: "baby unifox",
                plural: "baby unifoxes"
            },
            unlocked: false,
            spriteName: "babyUnicorn",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 22, vomit: 36 },
            desiredFood: [{type: "strawberry", amount: 4}]
        },
        unifox: {
            journalInfo: {
                name: "Vulpes Unicornum (adult)",
                temperament: "Shy"
            },
            displayNames: {
                singular: "unifox",
                plural: "unifoxes"
            },
            unlocked: false,
            spriteName: "unicorn",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 1, vomit: 40 },
            desiredFood: [{type: "strawberry", amount: 5}, {type: "carrot", amount: 4}]
        } /*,
        rammus2: { // For testing fractional food
            journalInfo: {
                name: "Aqua Rammus",
                temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            fxFrames: {eat: 16, vomit: 60 },
            spriteTint: 0xddffff,
            desiredFood: [{type: "carrot", amount: (1/2)}, {type: "apple", amount: (5/4)}],
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        } */
    };

    this.creatures = [];

    // Save / load which creatures have been discovered
    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);
};

/*
 * CreatureManager.LogNumCreaturesFed - logs the number of creatures successfully fed
 * @param type string, type of creature fed
 * @param num int, number of creatures fed
 * NOTE: Ratio is automatically derived by desired ratio is creature data
 */
GlassLab.CreatureManager.prototype.LogNumCreaturesFed = function (type, num) {
    var creatureData = this.creatureDatabase[type];
    if (!creatureData.unlocked) {
        creatureData.unlocked = "new"; // note the fact that it's newly unlocked
        GLOBAL.saveManager.Save(); // save when we unlock creatures

        // Delay showing the journal
        GLOBAL.Journal.wantToShow = type; // remember the creature we want to show in the journal
        GLOBAL.UIManager.journalButton.toggleActive(true);
    }
};

GlassLab.CreatureManager.prototype.AddCreature = function(creature)
{
    creature.name = creature.type + this.creatures.length; // for debugging purposes
    this.creatures.push(creature);
};

GlassLab.CreatureManager.prototype.RemoveCreature = function(creature)
{
    var creatureIndex = this.creatures.indexOf(creature);
    if (creatureIndex != -1)
    {
        this.creatures.splice(creatureIndex, 1);
    }
    else
    {
        console.error("Tried to remove a creature that wasn't tracked");
    }
};

GlassLab.CreatureManager.prototype.GetCreatureData = function (type) {
    return this.creatureDatabase[type];
};

GlassLab.CreatureManager.prototype.GetCreatureName = function (type, plural) {
    var key = (plural? "plural" : "singular");
    return this.creatureDatabase[type].displayNames[key];
};

GlassLab.CreatureManager.prototype.DestroyAllCreatures = function() {
    for (var i = GLOBAL.creatureLayer.children.length-1; i>=0; i--) {
        GLOBAL.creatureLayer.getChildAt(i).destroy();
    }

    this.creatures = [];
};

GlassLab.CreatureManager.prototype.CreateCreature = function(type, centered)
{
    var creature = new GlassLab.Creature(this.game, type);
    GLOBAL.creatureLayer.add(creature.sprite);
    if (centered) {
        creature.moveToTile( GLOBAL.tileManager.tilemap.width/2, GLOBAL.tileManager.tilemap.height/2 );
    } else {
        creature.moveToRandomTile();
    }
    creature.lookForTargets();

    return creature;
};

GlassLab.CreatureManager.prototype.CreateCreatures = function(type, number, centered) {
    console.log("Create creatures:", type, number, centered);
    for (var i = 0; i < number; i ++) {
        this.CreateCreature(type, centered);
    }
};

GlassLab.CreatureManager.prototype._onSaveRequested = function(blob)
{
    var unlockedCreatures = [];
    for (var type in this.creatureDatabase) {
        if (type.unlocked) unlockedCreatures.push(type);
    }
    blob.unlockedCreatures = unlockedCreatures;
};

GlassLab.CreatureManager.prototype._onGameLoaded = function(blob)
{
    if (blob && blob.unlockedCreatures) {
        for (var i = 0; i < blob.unlockedCreatures.length; i++) {
            if (blob.unlockedCreatures[i] in this.creatureDatabase) {
                blob.unlockedCreatures[i].unlocked = true;
            }
        }
    }
};

