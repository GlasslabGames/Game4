/**
 * Created by Rose Abernathy on 2/13/2015.
 */

/**
 * SortingGame
 */

GlassLab.SortingGame = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.width = 750;
    this.height = 550;

    this.cards = []; // list the SortingGameCards

    var bg = game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawRect(0, 0, this.width, this.height);
    this.sprite.addChild(bg);

    var label = game.make.text(15, 15, "Match tokens to cards by predicting how much food each set of creatures will have!", {font: "bold 13pt arial"});
    this.sprite.addChild(label);

    this.addCard( new GlassLab.SortingGameCard(this, "rammus", 4, 4, GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly) );
    this.addCard( new GlassLab.SortingGameCard(this, "unifox", 2, [1,2], GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly) );
    this.addCard( new GlassLab.SortingGameCard(this, "unifox", 6, [14,1], GlassLab.SortingGameCard.DISPLAY_STYLES.numbersOnly) );
};

GlassLab.SortingGame.prototype.addCard = function(card) {
    console.log(card);
    this.sprite.addChild(card);
    card.x = 15 + this.cards.length * 245;
    card.y = 50;
    this.cards.push(card);
};

/**
 * SortingGameCard
 */

GlassLab.SortingGameCard = function(sortingGame, creatureType, numCreatures, numFoodsPerCreature, displayMode) {
    GlassLab.UIDragTarget.prototype.constructor.call(this, sortingGame.game, 230, 350, "", true);

    this.sortingGame = sortingGame;
    this.creatureType = creatureType;
    this.numCreatures = numCreatures;
    this.numFoodsPerCreature = [].concat(numFoodsPerCreature); // make sure it's an array

    if (displayMode == GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly) {
        this._addSpriteDisplay();
    } else if (displayMode == GlassLab.SortingGameCard.DISPLAY_STYLES.numbersOnly) {
        this._addNumberDisplay();
    }

    this.target = this.game.make.sprite(this.actualWidth / 2, this.actualHeight - 70, "dashedCircle");
    this.target.anchor.set(0.5, 0.5);
    this.target.tint = 0xdddddd;
    this.addChild(this.target);

    var mark =  this.game.make.text(this.actualWidth / 2, this.actualHeight - 70, "?", {font: "bold 50pt arial", fill: "#ffffff"});
    mark.anchor.setTo(0.5, 0.5);
    this.addChild(mark);
};

// Extend UIDragTarget
GlassLab.SortingGameCard.prototype = Object.create(GlassLab.UIDragTarget.prototype);
GlassLab.SortingGameCard.prototype.constructor = GlassLab.SortingGameCard;

// Enum all the possible display styles for the cards. Add more as needed.
GlassLab.SortingGameCard.DISPLAY_STYLES = {spritesOnly: "spritesOnly", numbersOnly: "numbersOnly"};

GlassLab.SortingGameCard.prototype._addSpriteDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var colWidth = 55, rowHeight = 40;
    this.displaySprite = this.game.make.sprite((this.actualWidth - colWidth * this.numCreatures) / 2 + colWidth / 2, rowHeight / 2 + 15);
    this.addChild(this.displaySprite);

    for (var col = 0; col < this.numCreatures; col++) {
        var creature = this.game.make.sprite(col * colWidth, 0, creatureInfo.spriteName+"_idle");
        creature.scale.setTo(0.1, 0.1);
        creature.anchor.setTo(0.5, 0.5);
        this.displaySprite.addChild(creature);

        var row = 1;
        for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
            var foodInfo = GlassLab.FoodTypes[creatureInfo.desiredFood[i].type];
            var numFoods = this.numFoodsPerCreature[i] || 0;
            for (var j = 0; j < numFoods; j++) {
                var food = this.game.make.sprite(col * colWidth, (row++) * rowHeight + 10, foodInfo.spriteName);
                food.scale.setTo(0.3, 0.3);
                food.anchor.setTo(0.5, 0.5);
                this.displaySprite.addChild(food);
            }
        }
    }
};

GlassLab.SortingGameCard.prototype._addNumberDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var rowHeight = 65;
    this.displaySprite = this.game.make.sprite(this.actualWidth / 2 - 40, rowHeight / 2 + 15);
    this.addChild(this.displaySprite);

    var creature = this.game.make.sprite(0, 0, creatureInfo.spriteName+"_idle");
    creature.scale.setTo(0.15, 0.15);
    creature.anchor.setTo(0.5, 0.5);
    this.displaySprite.addChild(creature);

    var label = this.game.make.text(60, (i+1) * rowHeight, "x"+this.numCreatures, {font: "bold 30pt arial"});
    label.anchor.setTo(0, 0.5);
    this.displaySprite.addChild(label);

    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        var foodInfo = GlassLab.FoodTypes[creatureInfo.desiredFood[i].type];
        var numFoods = this.numFoodsPerCreature[i] || 0;
        if (numFoods) {
            var food = this.game.make.sprite(0, (i+1) * rowHeight + 10, foodInfo.spriteName);
            food.scale.setTo(0.45, 0.45);
            food.anchor.setTo(0.5, 0.5);
            this.displaySprite.addChild(food);

            label = this.game.make.text(60, (i+1) * rowHeight, "x"+numFoods, {font: "bold 30pt arial"});
            label.anchor.setTo(0, 0.5);
            this.displaySprite.addChild(label);
        }
    }
};