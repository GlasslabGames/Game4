/**
 * Created by Rose Abernathy on 2/13/2015.
 */

/**
 * SortingGame
 */

GlassLab.SortingGame = function(game) {
    GlassLab.UIWindow.prototype.constructor.call(this, game);
    this.autoCloseable = false; // can't be closed until you finish it

    this.actualWidth = 800;
    this.actualHeight = 600;

    this.cards = []; // list the SortingGameCards
    this.tokens = {}; // dictionary of lists of SortingGameTokens, by value (too little, etc)

    this.root = game.make.sprite(this.actualWidth * -0.5 - 20, this.actualHeight * -0.5); // make a sprite to offset all the children
    this.addChild(this.root);

    // dim world behind bonus game - there may be a more generalized method for doing this:
    var bg_color = game.make.graphics();
    bg_color.beginFill(0x000000).drawRect(0, 0, this.actualWidth, this.actualHeight);
    bg_color.alpha = 0.25;
    this.root.addChild(bg_color);

    // bonus game bg:
    var bg = game.make.image(0, 0, "bonusBoardBg");
    this.root.addChild(bg);

    /* tests
    this.addCard( "rammus", 2, 4, GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
    this.addCard( "unifox", 1, [1,7], GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly);
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

    // add bonusAnims spritesheet and add get_coins anim:
    this.largeCoin = game.make.sprite(575, 498, "bonusAnims");
    this.largeCoin.animations.add("get_coins", Phaser.Animation.generateFrameNames("bonus_get_coins_",277,310,".png",3), 24, false);
    this.largeCoin.anchor.set(0.5, 0.5);
    this.root.addChild(this.largeCoin);

    this.bonusAmount = 0;
    this.bonusAmountLabel = game.make.text(630, 517, "x 0", {font: "36px EnzoBlack", fill: "#fff"});
    this.bonusAmountLabel.anchor.setTo(0, 0.5);
    this.bonusAmountLabel.anchor.y = Math.round(this.bonusAmountLabel.height * 0.5) / this.bonusAmountLabel.height; // round to avoid blur
    this.root.addChild(this.bonusAmountLabel);

    this.visible = false; // start invisible until we want to begin the sorting game
};

GlassLab.SortingGame.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.SortingGame.prototype.constructor = GlassLab.SortingGame;

GlassLab.SortingGame.COMPARISON_VALUES = {NotEnough: "Not Enough", justRight: "Just Right", tooMuch: "Too Much"};
GlassLab.SortingGame.REWARD_PER_CARD = 10;

GlassLab.SortingGame.prototype.addCard = function(creatureType, numCreatures, numFood, displayMode, challengeType) {
    var card = new GlassLab.SortingGameCard(this, creatureType, numCreatures, numFood, displayMode, challengeType);
    this.root.addChild(card);
    card.x = 50 + this.cards.length * 240;
    card.y = 45;
    this.cards.push(card);
    card.events.onCardAnswered.add(this._onCardAnswered, this);
    return card;
};

GlassLab.SortingGame.prototype.addToken = function(value, pileCol) {
    var token = new GlassLab.SortingGameToken(this, value);
    this.tokenParent.addChild(token);
    token.x = 135 + (pileCol * 125) + (this.tokens[value].length * 10);
    token.y = 500 - (this.tokens[value].length * 10);
    this.tokens[value].push(token);
    return token;
};

// Only let the player drag the top token from the stack
GlassLab.SortingGame.prototype.refreshTokenStack = function(stack) {
    for (var i = 0; i < stack.length; i++) {
        stack[i].inputEnabled = (i == stack.length - 1);
        if (stack[i].inputEnabled) stack[i].input.priorityID = GLOBAL.UIpriorityID; // this gets reset when we disable the input
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
        this.cardsCorrect ++;
        this.bonusAmount += GlassLab.SortingGame.REWARD_PER_CARD;

        this.bonusAmountLabel.text = "x " + this.bonusAmount;

        //if (this.cardsCorrect == this.cards.length) { // color text green if they got them all right
        //    this.bonusAmountLabel.style.fill = "#39b54a";
        //}

        // animate the coin:
        var anim = this.largeCoin.play("get_coins");


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
        if (this.bonusAmount) GLOBAL.audioManager.playSound("successSound");
        this.game.time.events.add( Phaser.Timer.SECOND, function() { this.finish() }, this);
    }
};

GlassLab.SortingGame.prototype.start = function(data) {
    if (!data) data = this.storedData;
    if (!data) {
        console.error("Tried to start Sorting Game without any data or stored data!");
        return;
    }

    this.show();

    // Remove all the cards and make new ones. (Yes, we should reset cards instead, but that's more complicated.)
    while (this.cards.length) {
        var card = this.cards.pop();
        card.destroy();
    }

    // Insert cards in a random order
    while (data.length) {
        var i = Math.floor( Math.random() * data.length );
        var card = this.addCard( data[i].creatureType, data[i].numCreatures, data[i].numFood, data[i].displayMode, data[i].challengeType );
        data.splice(i, 1);
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
    this.bonusAmountLabel.text = "x 0";
    this.cardsAnswered = 0;
    this.cardsCorrect = 0;
    this.bonusAmountLabel.style.fill = "#fff";

    GLOBAL.audioManager.switchMusic("bonus");

    GlassLabSDK.saveTelemEvent("bonus_game_start", {});
};

GlassLab.SortingGame.prototype.finish = function() {
    GLOBAL.inventoryManager.AddMoney(this.bonusAmount);

    GlassLabSDK.saveTelemEvent("bonus_game_end", {proportion_correct: this.cardsCorrect / this.cardsAnswered});

    this.hide();
    GLOBAL.audioManager.revertMusic();
    GlassLab.SignalManager.bonusGameComplete.dispatch();
};

/**
 * SortingGameCard
 */

GlassLab.SortingGameCard = function(sortingGame, creatureType, numCreatures, numFood, displayMode, problemType) {
    GlassLab.UIDragTarget.prototype.constructor.call(this, sortingGame.game, 220, 350, null, "", true);

    this.sortingGame = sortingGame;
    this.creatureType = creatureType;
    this.numCreatures = numCreatures;
    this.numFood = [].concat(numFood); // make sure it's an array
    this.id = sortingGame.cards.length;
    this.displayMode = displayMode;
    this.problemType = problemType;

    // Calculate the correct answer to this card. For now, creatures with multiple kinds of food just look at the total food.
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);
    var totalFoodDesired = 0;
    var totalFoodShown = 0;
    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        totalFoodDesired += creatureInfo.desiredFood[i].amount * this.numCreatures;
        totalFoodShown += this.numFood[i] || 0;
    }

    if (totalFoodShown < totalFoodDesired) this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.NotEnough;
    else if (totalFoodShown > totalFoodDesired) this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.tooMuch;
    else this.targetValue = GlassLab.SortingGame.COMPARISON_VALUES.justRight;

    // Draw the creatures & food that are displayed on the card
    if (displayMode == GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly) {
        this._addSpriteDisplay();
    } else if (displayMode == GlassLab.SortingGameCard.DISPLAY_STYLES.numbersOnly) {
        this._addNumberDisplay();
    }

    // dashed circle sprite:
    this.target = this.game.make.sprite(this.actualWidth / 2, this.actualHeight - 70, "bonusStickerDropzone");
    this.target.anchor.set(0.5, 0.5);
    this.addChild(this.target);

    // text "place sticker here!"
    var mark =  this.game.make.text(this.actualWidth / 2, this.actualHeight - 67, "Place\nSticker\nHere!",
        {font: "14px EnzoBlack", align: "center", fill: "#a0a9b2"});
    mark.anchor.x = Math.round(mark.width * 0.5) / mark.width; // round to avoid subpixel blur
    mark.anchor.y = Math.round(mark.height * 0.5) / mark.height; // round to avoid subpixel blur
    mark.lineSpacing = -5;
    this.addChild(mark);

    // large X and checkmark:
    for (var spriteName in {bonusXmark: 0, bonusCheckmark: 0}) {
        var sprite = this.game.make.sprite(this.actualWidth / 2, 110, spriteName);
        sprite.anchor.setTo(0.5, 0.5);
        sprite.visible = false;
        this.addChild(sprite);
        this[spriteName] = sprite; // now we have the properties this.bonusCheckmark and this.bonusXmark
    }

    this.replace = false; // only allow them to drop 1 token
    this.objectValidator = function(obj) { return (obj instanceof GlassLab.SortingGameToken); };
    this.childObjectOffset.setTo(this.actualWidth / 2, this.actualHeight - 70);

    this.events.onCardAnswered = new Phaser.Signal();
    this.events.onObjectDropped.add(this._onObjectDropped, this);
};

// Extend UIDragTarget
GlassLab.SortingGameCard.prototype = Object.create(GlassLab.UIDragTarget.prototype);
GlassLab.SortingGameCard.prototype.constructor = GlassLab.SortingGameCard;

// Enum all the possible display styles for the cards. Add more as needed.
GlassLab.SortingGameCard.DISPLAY_STYLES = {spritesOnly: "spritesOnly", numbersOnly: "numbersOnly"};

GlassLab.SortingGameCard.prototype._redraw = function() {
    return; // don't draw the UIDragTarget in this version
};

GlassLab.SortingGameCard.prototype._onDestroy = function() {
    GlassLab.UIDragTarget.prototype._onDestroy.call(this);
    if (this.token) this.token.destroy(); // make sure to cleanup the token (though this should happen automatically?..)
    this.events.onCardAnswered.dispose();
};

GlassLab.SortingGameCard.prototype._onObjectDropped = function(obj) {
    this.correct = obj.value == this.targetValue;
    this.token = obj;
    this._animateResult();

    GlassLabSDK.saveTelemEvent("bonus_game_answer", {
        card_id: this.id,
        target_value: this.targetValue.toLowerCase().replace("\n"," "), // "TOO\nMUCH" -> "too much"
        answer_value: obj.value.toLowerCase().replace("\n"," "),
        success: this.correct,
        creature_type: this.creatureType,
        creature_count: this.numCreatures,
        foodA_count: this.numFood[0],
        foodB_count: this.numFood[1] || 0,
        problem_type: this.problemType,
        format: this.displayMode
    });

};

GlassLab.SortingGameCard.prototype._animateResult = function(obj) {
    var indicator = (this.correct)? this.bonusCheckmark : this.bonusXmark;
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
        // do sticker splode, then puff:
        // TODO: this needs refinement!
        this.token.imgFront.alpha = 0; // hide static asset
        this.token.stickerAnim.alpha = 1; // reveal anim sprite
        var anim = this.token.stickerAnim.play("sticker_splode");
        if (anim) {
            anim.onComplete.addOnce(function() {
                // create new imgBack with correct img:
                this.token.imgBack;
                if (this.targetValue == "Just Right")
                    this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionJustRight");
                else if (this.targetValue == "Too Much")
                    this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionTooMuch");
                else // Not Enough
                    this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionNotEnough");
                this.token.imgBack.anchor.setTo(0.5, 0.5);
                this.token.imgBack.alpha = 0; // init it hidden
                this.token.addChild(this.token.imgBack);

                // animate the puff and bring to front:
                var anim_puff = this.token.stickerAnim.play("smoke_puff");
                this.token.stickerAnim.anchor.set(0.5, 0.75);
                this.token.addChild(this.token.stickerAnim);
                if (anim_puff) {
                    anim_puff.onComplete.addOnce(function() {
                        // reveal imgBack
                        this.token.imgBack.alpha = 1;
                    }, this);
                }
            }, this);
        }

        // flip the coin by tweening the scale and changing the contents in the middle
        // OLD:
        /*
        var flipTween1 = this.game.add.tween(this.token.scale).to( { x: 0 }, 300, Phaser.Easing.Quadratic.In);
        flipTween1.onComplete.add(function() {

            // create new imgBack with correct img:
            this.token.imgBack;
            if (this.targetValue == "Just Right")
                this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionJustRight");
            else if (this.targetValue == "Too Much")
                this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionTooMuch");
            else // Not Enough
                this.token.imgBack = this.game.make.sprite(0, 0, "bonusCorrectionNotEnough");
            this.token.imgBack.anchor.setTo(0.5, 0.5);
            this.token.addChild(this.token.imgBack);

            // update label/tooltip to show right answer:
            this.token.label.text = this.targetValue; // show the right answer
            this.token.label.style.fill = "#"+targetColor.toString(16); // turn the text red
        }, this);
        var flipTween2 = this.game.add.tween(this.token.scale).to( { x: 1 }, 300, Phaser.Easing.Quadratic.Out);
        colorTween.chain(flipTween1, flipTween2);
        */
    }
    else {
        // do "correct" anim
    }

    // animate the coin, etc:
    colorTween.onComplete.add(function() {
        this.events.onCardAnswered.dispatch(this, this.correct);
    }, this);
};

GlassLab.SortingGameCard.prototype._addSpriteDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var colWidth = 45, rowHeight = 35;
    var maxCols = 5;
    this.displaySprite = this.game.make.sprite(colWidth / 2, rowHeight / 2 + 25);
    this.addChild(this.displaySprite);

    var foodLeft = {}; // track the total number of food left to split among all creatures

    var width = this.numCreatures * colWidth;
    var offset = (this.getWidth() - width) / 2;
    for (var i = 0; i < this.numCreatures; i++) {
        var creature = this.game.make.sprite(i * colWidth + offset, 0, creatureInfo.spriteName + "_art");
        creature.scale.setTo(0.2, 0.2);
        creature.anchor.setTo(0.5, 0.5);
        this.displaySprite.addChild(creature);
    }

    var row, lastRow = 1;
    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        var width = Math.min(this.numFood[i], maxCols) * colWidth;
        var offset = (this.getWidth() - width) / 2;

        var foodType = creatureInfo.desiredFood[i].type;
        var foodInfo = GlassLab.FoodTypes[foodType];
        for (var j = 0; j < this.numFood[i]; j++) {
            var col = j % maxCols;
            row = Math.floor(j / maxCols) + lastRow;
            var food = this.game.make.sprite(col * colWidth + offset, row * rowHeight + 10, foodInfo.spriteName);
            food.scale.setTo(0.5, 0.5);
            food.anchor.setTo(0.5, 0.5);
            this.displaySprite.addChild(food);
        }
        lastRow = row + 1;
    }
};

GlassLab.SortingGameCard.prototype._addNumberDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var rowHeight = 65;
    this.displaySprite = this.game.make.sprite(this.actualWidth / 2 - 40, rowHeight / 2 + 15);
    this.addChild(this.displaySprite);

    var creature = this.game.make.sprite(0, 0, creatureInfo.spriteName+"_art");
    creature.scale.setTo(0.3, 0.3);
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
            food.scale.setTo(0.75, 0.75);
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

    this.input.priorityID = GLOBAL.UIpriorityID; // are the tokens under the top token supposed to be draggable?
    this.sortingGame = sortingGame;
    this.value = value;

    this.actualWidth = this.actualHeight = 100;
    this.hitArea = new Phaser.Circle(0, 0, this.actualWidth); // very important!

    // token image and sticker anims
    this.imgFront;
    this.stickerAnim = this.game.make.sprite(0, 0, "bonusAnims");
    if (value == "Just Right") {
        this.imgFront = this.game.make.sprite(0, 0, "bonusJustRight");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_just_right_",267,285,".png",3), 24, false);
    }
    else if (value == "Too Much") {
        this.imgFront = this.game.make.sprite(0, 0, "bonusTooMuch");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_too_much_",267,285,".png",3), 24, false);
    }
    else { // Not Enough
        this.imgFront = this.game.make.sprite(0, 0, "bonusNotEnough");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_not_enough_",267,285,".png",3), 24, false);
    }

    // add smoke puff:
    this.stickerAnim.animations.add("smoke_puff",
        Phaser.Animation.generateFrameNames("smoke_puff_bonus_game_",282,312,".png",3), 24, false);

    this.imgFront.anchor.setTo(0.5, 0.5);
    this.addChild(this.imgFront);
    this.stickerAnim.anchor.set(0.5, 0.5);
    this.stickerAnim.alpha = 0;
    this.addChild(this.stickerAnim);


    // token label - TODO: make this a tooltip style label
    this.label = this.game.make.text(0, 0, value, {font: "bold 18pt arial", align: "center", fill: "#fff"});
    this.label.anchor.setTo(0.5, 0.5);
    this.label.alpha = 0; // hiding for now
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
