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
                name: "Rammus Gnarlus (juvenile)",
                temperament: "Brash"
            },
            displayNames: {
                singular: "juvenile rammus",
                plural: "juvenile rammuses"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "babyram",
            fxFrames: {eat: 14, vomit: 21 },
            desiredFood: [{type: "broccoli", amount: 3}]
        },
        rammus: {
            journalInfo: {
                name: "Rammus Gnarlus (adult)",
                temperament: "Bold"
            },
            displayNames: {
                singular: "rammus",
                plural: "rammuses"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "ram",
            fxFrames: {eat: 16, vomit: 60 },
            desiredFood: [{type: "broccoli", amount: 3}, {type: "tincan", amount: 5}]
        },
        baby_unifox: {
            journalInfo: {
                name: "Unifoxi Elusa (juvenile)",
                temperament: "Timid"
            },
            displayNames: {
                singular: "juvenile unifox",
                plural: "juvenile unifoxi"
            },
            unlocked: false,
            spriteName: "babyunifox",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 22, vomit: 36 },
            desiredFood: [{type: "strawberry", amount: 4}]
        },
        unifox: {
            journalInfo: {
                name: "Unifoxi Elusa (adult)",
                temperament: "Shy"
            },
            displayNames: {
                singular: "unifox",
                plural: "unifoxi"
            },
            unlocked: false,
            spriteName: "unifox",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 1, vomit: 40 },
            desiredFood: [{type: "strawberry", amount: 5}, {type: "carrot", amount: 4}]
        },
        baby_bird: {
            journalInfo: {
                name: "Flockin Aviarus (junevile)",
                temperament: "Flighty"
            },
            displayNames: {
                singular: "juvenile flockin",
                plural: "juvenile flockins"
            },
            unlocked: true,
            spriteName: "babybird",
            fxFrames: {eat: 16, vomit: 60 },
            desiredFood: [{type: "apple", amount: (3/4)}]
        },
        bird: {
            journalInfo: {
                name: "Flockin Aviarus (adult)",
                temperament: "Friendly"
            },
            displayNames: {
                singular: "flockin",
                plural: "flockins"
            },
            unlocked: true,
            spriteName: "bird",
            fxFrames: {eat: 16, vomit: 60 },
            desiredFood: [{type: "apple", amount: (10/4)}, {type: "carrot", amount: (5/4)}]
        }
    };

    this.creatures = [];

    GlassLab.SignalManager.gameInitialized.addOnce(this._loadDiscoveredCreatures, this);
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
        this._saveDiscoveredCreatures();

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

GlassLab.CreatureManager.prototype.getMinCreatureCols = function(creatureType) {
    var desiredFood = this.creatureDatabase[creatureType].desiredFood;
    var min = 0;
    // there's not an easy way to compute the common denominator from floats, so just search until we find an int that works
    for (var i = 1; i < 20; i++) { // put a cap at 20 just in case, but we don't expect to hit it. We except 2, 3, 4, etc
        if (desiredFood[0].amount * i % 1 == 0 && (!desiredFood[1] || desiredFood[1].amount * i % 1 == 0)) {
            min = i;
            break;
        }
    }
    return min;
};

GlassLab.CreatureManager.prototype._saveDiscoveredCreatures = function()
{
    var unlockedCreatures = [];
    for (var type in this.creatureDatabase) {
        if (this.creatureDatabase[type].unlocked) unlockedCreatures.push(type);
    }
    GLOBAL.saveManager.SaveData("discoveredCreatures", unlockedCreatures);
};

GlassLab.CreatureManager.prototype._loadDiscoveredCreatures = function()
{
    if (GLOBAL.saveManager.HasData("discoveredCreatures")) {
        var creatures = GLOBAL.saveManager.LoadData("discoveredCreatures");
        for (var i = 0; i < creatures.length; i++) {
            if (creatures[i] in this.creatureDatabase) {
                this.creatureDatabase[creatures[i]].unlocked = true;
            }
        }
    }
};

