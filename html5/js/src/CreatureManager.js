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
    this.creatureList = ["rammus", "unifox"]; // list of creatures in the order they should appear in the journal
    // TODO: update the creatureList when creatures are unlocked or change how pages in the journal work
    this.creatureDatabase = {
        rammus: {
            journalInfo: {
                name: "Rammus Jerkum",
                temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            fxFrames: {eat: 16, vomit: 60 },
            desiredFood: [{type: "carrot", amount: 3}],
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        },
        rammus2: { // For testing fractional food
            journalInfo: {
                name: "Aqua Rammus",
                temperament: "Combative"
            },
            unlocked: true, // if the player has discovered this animal yet
            spriteName: "sheep",
            fxFrames: {eat: 16, vomit: 60 },
            spriteTint: 0xddffff,
            desiredFood: [{type: "carrot", amount: (1/2)}, {type: "potato", amount: (5/4)}],
            discoveredFoodCounts: {} // discoveredFoodCounts[n] will be "new" or true when they discovered the food for n creatures
        },
        unifox: {
            journalInfo: {
                name: "Vulpes Unicornum",
                temperament: "Shy"
            },
            unlocked: true,
            spriteName: "unicorn",
            eatFxStyle: {carrot: "long", potato: "long"}, // specification for which animation to play when eating certain food
            fxFrames: {eat: 1, vomit: 45 },
            desiredFood: [{type: "carrot", amount: 2}, {type: "potato", amount: 3}],
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

GlassLab.CreatureManager.prototype._onSaveRequested = function(blob) {
    blob.creatures = [];
};
