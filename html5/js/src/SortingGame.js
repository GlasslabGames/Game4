/**
 * Created by Rose Abernathy on 2/13/2015.
 */

/**
 * SortingGame
 */

GlassLab.SortingGame = function(game) {
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.game = game;

    this.actualWidth = 750;
    this.actualHeight = 550;

    this.root = game.make.sprite(this.actualWidth * -0.5, this.actualHeight * -0.5); // make a sprite to offset all the children
    this.addChild(this.root);

    this.cards = []; // list the SortingGameCards
    this.tokens = {}; // dictionary of lists of SortingGameTokens, by value (too little, etc)

    var bg = game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawRect(0, 0, this.actualWidth, this.actualHeight);
    this.root.addChild(bg);

    var label = game.make.text(15, 15, "Match tokens to cards by predicting how much food each set of creatures will have!", {font: "bold 13pt arial"});
    this.root.addChild(label);

    /* tests
    this.addCard( "rammus", 4, 4, GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
    this.addCard( "unifox", 2, [1,2], GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
    this.addCard( "rammus", 6, 3, GlassLab.SortingGameCard.DISPLAY_STYLES.numbersOnly);
    */

    this.tokenParent = game.make.sprite();
    this.root.addChild(this.tokenParent);

    var col = 0; // one col per value
    for (var key in GlassLab.SortingGame.COMPARISON_VALUES) {
        var value = GlassLab.SortingGame.COMPARISON_VALUES[key];
        this.tokens[value] = [];
        for (var i = 0; i < 3; i++) {
            this.addToken( value, col );
        }
        col++;
        this.refreshTokenStack(this.tokens[value]);
    }

    this.bonusAmount = 0;
    this.bonusAmountLabel = game.make.text(600, 480, "$0", {font: "bold 40pt arial"});
    this.bonusAmountLabel.anchor.setTo(0, 0.5);
    this.root.addChild(this.bonusAmountLabel);

    var bonusLabel = game.make.text(610, 440, "BONUS:", {font: "bold 13pt arial"});
    bonusLabel.anchor.setTo(0, 0.5);
    this.root.addChild(bonusLabel);

    this.visible = false; // start invisible until we want to begin the sorting game
};

GlassLab.SortingGame.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.SortingGame.prototype.constructor = GlassLab.SortingGame;

GlassLab.SortingGame.COMPARISON_VALUES = {tooLittle: "TOO\nLITTLE", justRight: "JUST\nRIGHT", tooMuch: "TOO\nMUCH"};
GlassLab.SortingGame.REWARD_PER_CARD = 10;

GlassLab.SortingGame.prototype.addCard = function(creatureType, numCreatures, numFood, displayMode) {
    var card = new GlassLab.SortingGameCard(this, creatureType, numCreatures, numFood, displayMode);
    this.root.addChild(card);
    card.x = 15 + this.cards.length * 245;
    card.y = 50;
    this.cards.push(card);
    card.events.onCardAnswered.add(this._onCardAnswered, this);
    return card;
};

GlassLab.SortingGame.prototype.addToken = function(value, pileCol) {
    var token = new GlassLab.SortingGameToken(this, value);
    this.tokenParent.addChild(token);
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

GlassLab.SortingGame.prototype._onCardAnswered = function(card, correct) {
    this.cardsAnswered ++;

    if (correct) {
        this.bonusAmount += GlassLab.SortingGame.REWARD_PER_CARD;

        this.bonusAmountLabel.text = "$" + this.bonusAmount;

        if (this.bonusAmount / GlassLab.SortingGame.REWARD_PER_CARD >= this.cardsAnswered) { // if they got them all right
            this.bonusAmountLabel.style.fill = "#39b54a";
        }

        // Animate the bonusAmountLabel
        var tween = this.game.add.tween(this.bonusAmountLabel.scale).to({
            x: 1.2,
            y: 1.2
        }, 200, Phaser.Easing.Quadratic.InOut)
            .to({x: 1, y: 1}, 200, Phaser.Easing.Quadratic.InOut);
        tween.start();
    }

    // If we answered all the cards, close after a short delay
    if (this.cardsAnswered >= this.cards.length) {
        this.game.time.events.add( Phaser.Timer.SECOND, function() { this.finish() }, this);
    }
};

GlassLab.SortingGame.prototype.start = function(data) {
    this.visible = true;

    // Remove all the cards and make new ones. (Yes, we should reset cards instead, but that's more complicated.)
    while (this.cards.length) {
        var card = this.cards.pop();
        card.destroy();
    }
    // Note: we could, if desired, randomly order the cards here
    for (var i = 0; i < data.length; i++) {
        this.addCard( data[i].creatureType, data[i].numCreatures, data[i].numFood, data[i].displayMode );
    }

    // Add tokens if we don't have any or some were used last time
    var col = 0; // one col per value
    for (var key in GlassLab.SortingGame.COMPARISON_VALUES) {
        var value = GlassLab.SortingGame.COMPARISON_VALUES[key];
        this.tokens[value] = this.tokens[value] || [];
        while (this.tokens[value].length < 3) {
            this.addToken( value, col );
        }
        col++;
        this.refreshTokenStack(this.tokens[value]);
    }
    this.tokenParent.parent.setChildIndex(this.tokenParent, this.tokenParent.parent.children.length - 1);

    this.bonusAmount = 0;
    this.bonusAmountLabel.text = "$0";
    this.cardsAnswered = 0;
};

GlassLab.SortingGame.prototype.finish = function() {
    GLOBAL.inventoryManager.AddMoney(this.bonusAmount);

    this.visible = false;
    GlassLab.SignalManager.bonusGameComplete.dispatch();
};

/**
 * SortingGameCard
 */

GlassLab.SortingGameCard = function(sortingGame, creatureType, numCreatures, numFood, displayMode) {
    GlassLab.UIDragTarget.prototype.constructor.call(this, sortingGame.game, 230, 350, "", true);

    this.sortingGame = sortingGame;
    this.creatureType = creatureType;
    this.numCreatures = numCreatures;
    this.numFood = [].concat(numFood); // make sure it's an array

    // Calculate the correct answer to this card. For now, creatures with multiple kinds of food just look at the total food.
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
    var totalFoodDesired = 0;
    var totalFoodShown = 0;
    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        totalFoodDesired += creatureInfo.desiredFood[i].amount * this.numCreatures;
        totalFoodShown += this.numFood || 0;
    }

    if (totalFoodShown < totalFoodDesired) this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.tooLittle;
    else if (totalFoodShown > totalFoodDesired) this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.tooMuch;
    else this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.justRight;

    // Draw the creatures & food that are displayed on the card
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
        var sprite = this.game.make.sprite(this.actualWidth / 2, 110, spriteName);
        sprite.anchor.setTo(0.5, 0.5);
        sprite.visible = false;
        this.addChild(sprite);
        this[spriteName] = sprite; // now we have the properties this.bigO and this.bigX
    }

    this.replace = false; // only allow them to drop 1 token
    this.objectValidator = function(obj) { return (obj instanceof GlassLab.SortingGameToken); };
    this.childObjectOffset.setTo(this.actualWidth / 2, 280);

    this.events.onCardAnswered = new Phaser.Signal();
    this.events.onObjectDropped.add(this._onObjectDropped, this);
};

// Extend UIDragTarget
GlassLab.SortingGameCard.prototype = Object.create(GlassLab.UIDragTarget.prototype);
GlassLab.SortingGameCard.prototype.constructor = GlassLab.SortingGameCard;

// Enum all the possible display styles for the cards. Add more as needed.
GlassLab.SortingGameCard.DISPLAY_STYLES = {spritesOnly: "spritesOnly", numbersOnly: "numbersOnly"};

GlassLab.SortingGameCard.prototype._onDestroy = function() {
    GlassLab.UIDragTarget.prototype._onDestroy.call(this);
    if (this.token) this.token.destroy(); // make sure to cleanup the token (though this should happen automatically?..)
    this.events.onCardAnswered.dispose();
};

GlassLab.SortingGameCard.prototype._onObjectDropped = function(obj) {
    this.correct = obj.value == this.targetValue;
    this.token = obj;
    this._animateResult();
};

GlassLab.SortingGameCard.prototype._animateResult = function(obj) {
    var indicator = (this.correct)? this.bigO : this.bigX;
    var targetColor = (this.correct)? 0x39b54a : 0xc1272d;
    var time = 300;

    indicator.visible = true;
    indicator.alpha = 0;
    this.game.add.tween(indicator).to( {alpha: 0.5}, time, Phaser.Easing.Quadratic.InOut, true);

    // jump through some hoops to tween a color
    var target = this.target;
    var startColor = this.target.tint;
    var colorTweenCounter = { step: 0 };
    var colorTween = this.game.add.tween(colorTweenCounter).to( { step: 1 }, time, Phaser.Easing.Quadratic.InOut, true);
    colorTween.onUpdateCallback(function() {
        target.tint = Phaser.Color.interpolateColor(startColor, targetColor, 1, colorTweenCounter.step);
    });

    if (!this.correct) {
        // flip the coin by tweening the scale and changing the contents in the middle
        var flipTween1 = this.game.add.tween(this.token.scale).to( { x: 0 }, 300, Phaser.Easing.Quadratic.In);
        flipTween1.onComplete.add(function() {
            this.token.label.text = this.targetValue; // show the right answer
            this.token.label.style.fill = "#"+targetColor.toString(16); // turn the text red
        }, this);
        var flipTween2 = this.game.add.tween(this.token.scale).to( { x: 1 }, 300, Phaser.Easing.Quadratic.Out);
        colorTween.chain(flipTween1, flipTween2);
    }

    colorTween.onComplete.add(function() {
        this.events.onCardAnswered.dispatch(this, this.correct);
    }, this);
};

GlassLab.SortingGameCard.prototype._addSpriteDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var colWidth = 55, rowHeight = 35;
    this.displaySprite = this.game.make.sprite((this.actualWidth - colWidth * this.numCreatures) / 2 + colWidth / 2, rowHeight / 2 + 15);
    this.addChild(this.displaySprite);

    var foodLeft = {}; // track the total number of food left to split among all creatures

    for (var col = 0; col < this.numCreatures; col++) {
        var creature = this.game.make.sprite(col * colWidth, 0, creatureInfo.spriteName+"_idle");
        creature.scale.setTo(0.1, 0.1);
        creature.anchor.setTo(0.5, 0.5);
        this.displaySprite.addChild(creature);

        var row = 1;
        for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
            var foodType = creatureInfo.desiredFood[i].type;
            var foodInfo = GlassLab.FoodTypes[foodType];
            if (!(foodType in foodLeft)) foodLeft[foodType] = this.numFood[i]; // start tracking the amount of food left
            var n = Math.min(Math.ceil(this.numFood[i] / this.numCreatures), foodLeft[foodType]);
            // the amount of food to show is usually just the total divided among the creatures, but reduce it if we have an odd amount of food left
            for (var j = 0; j < n; j++) {
                var food = this.game.make.sprite(col * colWidth, (row++) * rowHeight + 10, foodInfo.spriteName);
                food.scale.setTo(0.3, 0.3);
                food.anchor.setTo(0.5, 0.5);
                this.displaySprite.addChild(food);
                foodLeft[foodType] --;
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
        var numFoods = this.numFood[i] || 0;
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

    this.label = this.game.make.text(0, 0, value, {font: "bold 18pt arial", align: "center"});
    this.label.anchor.setTo(0.5, 0.5);
    this.addChild(this.label);

    this.dropValidator = function(target) { return (target instanceof GlassLab.SortingGameCard); };
    this.events.onDrop.add(this._onDrop, this);
    this.events.onStartDrag.add(this._onStartDrag, this);
};

// Extend UIDraggable
GlassLab.SortingGameToken.prototype = Object.create(GlassLab.UIDraggable.prototype);
GlassLab.SortingGameToken.prototype.constructor = GlassLab.SortingGameToken;

GlassLab.SortingGameToken.prototype._onDrop = function(target) {
    this.sortingGame.removeTokenFromStack(this);
    this.inputEnabled = false; // no longer allow them to move it
};

GlassLab.SortingGameToken.prototype._onStartDrag = function(target) {
    this.parent.setChildIndex(this, this.parent.children.length-1); // bring to top
};
