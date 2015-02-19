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
    this.tokens = {}; // dictionary of lists of SortingGameTokens, by value (too little, etc)

    var bg = game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawRect(0, 0, this.width, this.height);
    this.sprite.addChild(bg);

    var label = game.make.text(15, 15, "Match tokens to cards by predicting how much food each set of creatures will have!", {font: "bold 13pt arial"});
    this.sprite.addChild(label);

    this.addCard( "rammus", 4, 4, GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
    this.addCard( "unifox", 2, [1,2], GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
    this.addCard( "rammus", 6, 14, GlassLab.SortingGameCard.DISPLAY_STYLES.numbersOnly);

    var tokenParent = game.make.sprite();
    this.sprite.addChild(tokenParent);

    var col = 0; // one col per value
    for (var key in GlassLab.SortingGame.COMPARISON_VALUES) {
        var value = GlassLab.SortingGame.COMPARISON_VALUES[key];
        this.tokens[value] = [];
        for (var i = 0; i < 3; i++) {
            tokenParent.addChild( this.addToken( value, col ) );
        }
        col++;
        this.refreshTokenStack(this.tokens[value]);
    }

    this.bonusAmountLabel = game.make.text(600, 480, "$10", {font: "bold 40pt arial"});
    this.bonusAmountLabel.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.bonusAmountLabel);

    var bonusLabel = game.make.text(610, 440, "BONUS:", {font: "bold 13pt arial"});
    bonusLabel.anchor.setTo(0, 0.5);
    this.sprite.addChild(bonusLabel);
};

GlassLab.SortingGame.COMPARISON_VALUES = {tooLittle: "TOO\nLITTLE", justRight: "JUST\nRIGHT", tooMuch: "TOO\nMUCH"};

GlassLab.SortingGame.prototype.addCard = function(creatureType, numCreatures, numFoodsPerCreature, displayMode) {
    var card = new GlassLab.SortingGameCard(this, creatureType, numCreatures, numFoodsPerCreature, displayMode);
    this.sprite.addChild(card);
    card.x = 15 + this.cards.length * 245;
    card.y = 50;
    this.cards.push(card);
    return card;
};

GlassLab.SortingGame.prototype.addToken = function(value, pileCol) {
    var token = new GlassLab.SortingGameToken(this, value);
    this.sprite.addChild(token);
    token.x = 170 + pileCol * 130;
    token.y = 480 - this.tokens[value].length * 10;
    this.tokens[value].push(token);
    return token;
};

// Only let the player drag the top token from the stack
GlassLab.SortingGame.prototype.refreshTokenStack = function(stack) {
    for (var i = 0; i < stack.length; i++) {
        stack[i].inputEnabled = (i == stack.length - 1);
    }
};

GlassLab.SortingGame.prototype.removeTokenFromStack = function(token) {
    var stack = this.tokens[token.value];
    stack.splice( stack.indexOf(token), 1 );
    this.refreshTokenStack(stack);
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

    for (var spriteName in {bigX: 0, bigO: 0}) {
        var sprite = this.game.make.sprite(this.actualWidth / 2, 120, spriteName);
        sprite.alpha = 0.5;
        sprite.anchor.setTo(0.5, 0.5);
        sprite.visible = false;
        this.addChild(sprite);
        this[spriteName] = sprite; // now we have the properties this.bigO and this.bigX
    }

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

/**
 * SortingGameToken
 */

GlassLab.SortingGameToken = function(sortingGame, value) {
    GlassLab.UIDraggable.prototype.constructor.call(this, sortingGame.game);

    this.sortingGame = sortingGame;
    this.value = value;

    this.actualWidth = this.actualHeight = 100;
    this.hitArea = new Phaser.Circle(0, 0, this.actualWidth); // very important!

    var bg = this.game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawCircle(0, 0, this.actualWidth);
    this.addChild(bg);

    var label = this.game.make.text(0, 0, value, {font: "bold 18pt arial", align: "center"});
    label.anchor.setTo(0.5, 0.5);
    this.addChild(label);

    this.dropValidator = function(obj) { return true; };
};

// Extend UIDraggable
GlassLab.SortingGameToken.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.SortingGameToken.prototype.constructor = GlassLab.SortingGameToken;

GlassLab.SortingGameToken.prototype._onStartDrag = function() {
    GlassLab.UIDraggable.prototype._onStartDrag.call(this);
};

GlassLab.SortingGameToken.prototype._onEndDrag = function(success) {
    console.log("OnEndDrag. Success:",success);
    GlassLab.UIDraggable.prototype._onEndDrag.call(this, success);
    if (success) {
        this.sortingGame.removeTokenFromStack(this);
    }
};
