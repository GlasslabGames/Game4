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
    this.creatureList = ["baby_rammus", "rammus", "baby_unifox", "unifox", "baby_bird", "bird"]; // list of creatures in the order they should appear in the journal
    this.creatureDatabase = {
        baby_rammus: {
            journalInfo: {
                name: "Rammus Gnarlus (juvenile)",
                temperament: "Brash",
                numCreatures: 1
            },
            displayNames: {
                singular: "juvenile rammus",
                plural: "juvenile rammuses"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "babyram",
            fxFrames: {eat: 14, vomit: 21, poop: 40 },
            desiredFood: [{type: "broccoli", amount: 3}],
            minPenColumns: 1,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        },
        rammus: {
            journalInfo: {
                name: "Rammus Gnarlus (adult)",
                temperament: "Bold",
                numCreatures: 1
            },
            displayNames: {
                singular: "rammus",
                plural: "rammuses"
            },
            unlocked: false, // if the player has discovered this animal yet
            spriteName: "ram",
            fxFrames: {eat: 16, vomit: 60, poop: 40 },
            desiredFood: [{type: "broccoli", amount: 3}, {type: "tincan", amount: 5}],
            minPenColumns: 1,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        },
        baby_unifox: {
            journalInfo: {
                name: "Unifoxi Elusa (juvenile)",
                temperament: "Timid",
                numCreatures: 2
            },
            displayNames: {
                singular: "juvenile unifox",
                plural: "juvenile unifoxi"
            },
            unlocked: false,
            spriteName: "babyunifox",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 22, vomit: 36, poop: 70 },
            desiredFood: [{type: "strawberry", amount: 4}],
            minPenColumns: 1,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        },
        unifox: {
            journalInfo: {
                name: "Unifoxi Elusa (adult)",
                temperament: "Shy",
                numCreatures: 2
            },
            displayNames: {
                singular: "unifox",
                plural: "unifoxi"
            },
            unlocked: false,
            spriteName: "unifox",
            eatFxStyle: "long", // specification for which animation to play when eating food
            fxFrames: {eat: 1, vomit: 40, poop: 70 },
            desiredFood: [{type: "strawberry", amount: 4}, {type: "pizza", amount: 5}],
            minPenColumns: 1,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        },
        baby_bird: {
            journalInfo: {
                name: "Flockin Aviarus (junevile)",
                temperament: "Flighty",
                numCreatures: 3
            },
            displayNames: {
                singular: "juvenile flockin",
                plural: "juvenile flockins"
            },
            unlocked: false,
            spriteName: "babybird",
            fxFrames: {eat: 16, vomit: 60, poop: 70 },
            desiredFood: [{type: "meat", amount: (4/3)}], // 3 birds eat 4 food
            minPenColumns: 3,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        },
        bird: {
            journalInfo: {
                name: "Flockin Aviarus (adult)",
                temperament: "Friendly",
                numCreatures: 4
            },
            displayNames: {
                singular: "flockin",
                plural: "flockins"
            },
            unlocked: false,
            spriteName: "bird",
            fxFrames: {eat: 16, vomit: 60, poop: 70 },
            desiredFood: [{type: "meat", amount: (5/2)}, {type: "taco", amount: (5/4)}],
            minPenColumns: 4,
            otherFood: [
                {type: "mushroom", reaction: { result: "sick", details: {}}},
                {type: "donut", reaction: { result: "hyper", details: { speedMultiplier: 3 }}}
            ]
        }
    };

    this.creatures = [];

    GlassLab.SignalManager.gameInitialized.addOnce(this._loadDiscoveredCreatures, this);
};

/*
 * CreatureManager.LogNumCreaturesFed - logs the number of creatures successfully fed
 * @param type string, type of creature fed
 * @param num int, number of creatures fed
 * NOTE: Ratio is automatically derived by desired ratio in creature data
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
    for (var i = this.creatures.length-1; i>=0; i--) {
        this.creatures[i].destroy();
    }

    this.creatures = [];
};

GlassLab.CreatureManager.prototype.CreateCreature = function(type, centered)
{
    var creature = new GlassLab.Creature(this.game, type);
    GLOBAL.creatureLayer.add(creature);
    if (centered) {
        creature.moveToTile( GLOBAL.tileManager.tilemap.width/2, GLOBAL.tileManager.tilemap.height/2 );
    } else {
        creature.moveToRandomTile();
    }
    creature.lookForTargets();

    return creature;
};

GlassLab.CreatureManager.prototype.CreateCreatures = function(type, number, centered) {
    for (var i = 0; i < number; i ++) {
        this.CreateCreature(type, centered);
    }
};

GlassLab.CreatureManager.prototype.hideCreatures = function() {
    for (var i = 0; i < this.creatures.length; i++) {
        this.creatures[i].visible = false;
        if (!this.creatures[i].pen) { // if we're in a pen, we can chill
            this.creatures[i].StateTransitionTo(new GlassLab.CreatureState(this.game, this.creatures[i])); // else, go to a blank state
        }
    }
};

GlassLab.CreatureManager.prototype.showCreatures = function() {
    for (var i = 0; i < this.creatures.length; i++) {
        this.creatures[i].visible = true;
        if (!this.creatures[i].pen) { // if we're in a pen, we can chill
            this.creatures[i].lookForTargets();
        }
    }
};

GlassLab.CreatureManager.prototype.getCreatureWantsFractionalFood = function(creatureType) {
    var creatureData = this.creatureDatabase[creatureType];
    if (typeof(creatureData.minPenColumns) != "undefined") {
        if (creatureData.minPenColumns > 1)
            return true;
        else
            return false;
    } else {
        // determine by looking through all desiredFood amount values:
        for (var i = 0; i < creatureData.desiredFood.length; i++) {
            if (creatureData.desiredFood[i].amount % 1 != 0) return true;
        }
    }
    return false;
};

GlassLab.CreatureManager.prototype.getMinCreatureCols = function(creatureType) {
    var creatureData = this.creatureDatabase[creatureType];
    if (typeof(creatureData.minPenColumns) != "undefined")
        return creatureData.minPenColumns;
    else {
        // calculate by iterating through integers, looking for least common multiple that yeilds integer result:
        var desiredFood = creatureData.desiredFood;
        var min = 0;
        for (var i = 1; i < 20; i++) { // put a cap at 20 just in case, but we don't expect to hit it. We expect 2, 3, 4, etc
            if (desiredFood[0].amount * i % 1 == 0 && (!desiredFood[1] || desiredFood[1].amount * i % 1 == 0)) {
                min = i;
                break;
            }
        }
        return min;
    }
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

