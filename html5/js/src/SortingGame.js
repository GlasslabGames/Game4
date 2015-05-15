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
    //var bg_color = game.make.graphics();
    //bg_color.beginFill(0x000000).drawRect(0, 0, this.actualWidth, this.actualHeight);
    //bg_color.alpha = 0.25;
    //this.root.addChild(bg_color);

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
    this._draggingToken = false;

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

    // bonusAmount text, and hidden text behind it that animates when correct token is placed on card:
    this.bonusAmount = 0;
    this.bonusAmountLabel = game.make.text(630, 517, "x 0", {font: "36px EnzoBlack", fill: "#fff"});
    this.bonusAmountLabel = GlassLab.Util.SetCenteredText(this.bonusAmountLabel, null, 0, 0.5);
    this.root.addChild(this.bonusAmountLabel);

    this.bonusAmountAddedLabel = game.make.text(630, 500, "+ 0", {font: "36px EnzoBlack", fill: "#fff"}); // a bit higher
    this.bonusAmountAddedLabel.alpha = 0; // hidden for now
    this.bonusAmountAddedLabel = GlassLab.Util.SetCenteredText(this.bonusAmountAddedLabel, null, 0, 0.5);
    this.root.addChild(this.bonusAmountAddedLabel);

    this.visible = false; // start invisible until we want to begin the sorting game
};

GlassLab.SortingGame.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.SortingGame.prototype.constructor = GlassLab.SortingGame;

GlassLab.SortingGame.COMPARISON_VALUES = {NotEnough: "Not Enough", justRight: "Just Right", tooMuch: "Too Much"};
GlassLab.SortingGame.REWARD_PER_CARD = 10;

GlassLab.SortingGame.prototype.addCard = function(creatureType, numCreatures, numFood, displayMode, challengeType) {
    var card = new GlassLab.SortingGameCard(this, creatureType, numCreatures, numFood, displayMode, challengeType);
    this.root.addChild(card);
    card.x = 70 + this.cards.length * 240; // was 50 + len + 240
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
    this.cardsAnswered++;

    // if correct, add bonusAmount to the label and animate:
    if (correct) {
        this.cardsCorrect++;
        this.bonusAmount += GlassLab.SortingGame.REWARD_PER_CARD;
        this.bonusAmountLabel.text = "x " + this.bonusAmount;

        //if (this.cardsCorrect == this.cards.length) { // color text green if they got them all right
        //    this.bonusAmountLabel.style.fill = "#39b54a";
        //}

        // animate the coin:
        var anim = this.largeCoin.play("get_coins");

        // annoying slot machine audio:
        GLOBAL.audioManager.playSoundWithVolumeAndOffset("coinDropSound", 0.15, 0.0, true);
        if (anim) {
            anim.onComplete.addOnce(function() {
                GLOBAL.audioManager.fadeSound("coinDropSound", 100, 0.0); // fade to volume 0.0 quickly, then stop loop.
            }, this);
        }


        // animate the bonusAmountAddedLabel:
        this.bonusAmountAddedLabel.text = "+ " + GlassLab.SortingGame.REWARD_PER_CARD;
        var orig_y = this.bonusAmountAddedLabel.y;
        var tween = this.game.add.tween(this.bonusAmountAddedLabel)
            .to({y: orig_y - 30, alpha: 1}, 1200, Phaser.Easing.Quadratic.Out)
            .to({alpha: 0}, 300, Phaser.Easing.Quadratic.In)
            .to({y: orig_y}, 10, Phaser.Easing.Linear.None);
        tween.start();

        // Animate the bonusAmountLabel
        //var tween = this.game.add.tween(this.bonusAmountLabel.scale)
        //    .to({x: 1.2, y: 1.2}, 200, Phaser.Easing.Quadratic.InOut)
        //    .to({x: 1, y: 1}, 200, Phaser.Easing.Quadratic.InOut);
        //tween.start();
    }

    // If we answered all the cards, close after a short delay
    if (this.cardsAnswered >= this.cards.length) {
        if (this.bonusAmount) GLOBAL.audioManager.playSound("successSound");
        this.game.time.events.add( Phaser.Timer.SECOND * 3, function() { this.finish() }, this);
    }
};

GlassLab.SortingGame.prototype.start = function(data) {
    if (!data) data = this.storedData;
    if (!data) {
        console.error("Tried to start Sorting Game without any data or stored data!");
        return;
    }


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

    // reset the bonus amount:
    this.bonusAmount = 0;
    this.bonusAmountLabel.text = "x 0";
    this.cardsAnswered = 0;
    this.cardsCorrect = 0;
    this.bonusAmountLabel.style.fill = "#fff";

    GLOBAL.audioManager.switchMusic("bonus");

    GlassLabSDK.saveTelemEvent("bonus_game_start", {});

    this.show();

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
    GlassLab.UIDragTarget.prototype.constructor.call(this, sortingGame.game, 180, 350, null, "", true); // was 220 wide

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

    // dashed circle sprite and tween handler:
    this.dropzone = this.game.make.sprite(this.actualWidth / 2, this.actualHeight - 70, "bonusStickerDropzone");
    this.dropzone.anchor.set(0.5, 0.5);
    this.addChild(this.dropzone);
    this.dropzone_tween = null;

    // dropzone shade:
    this.dropzoneShade = this.game.make.sprite(this.actualWidth / 2, this.actualHeight - 70, "bonusStickerDropzoneShader");
    this.dropzoneShade.tint = 0x000000;
    this.dropzoneShade.alpha = 0; // hidden
    this.dropzoneShade.anchor.set(0.5, 0.5);
    this.addChild(this.dropzoneShade);
    this.dropzone_shade_tween = null;

    // borderAnim:
    this.borderAnim = this.game.make.sprite(this.actualWidth / 2, this.actualHeight - 70, "bonusAnims");
    this.borderAnim.animations.add("sticker_border_correct",
        Phaser.Animation.generateFrameNames("sticker_border_correct_",261,282,".png",3), 24, false);
    this.borderAnim.animations.add("sticker_border_incorrect",
        Phaser.Animation.generateFrameNames("sticker_border_incorrect_",261,274,".png",3), 24, false);
    this.borderAnim.anchor.set(0.5, 0.5);
    this.borderAnim.alpha = 0; // hide initially
    this.addChild(this.borderAnim);

    // text "place sticker here!"
    var mark =  this.game.make.text(this.actualWidth / 2, this.actualHeight - 67, "Place\nSticker\nHere!",
        {font: "14px EnzoBlack", align: "center", fill: "#a0a9b2"});
    mark = GlassLab.Util.SetCenteredText(mark, null, 0.5, 0.5);
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

    // stop hovering animation and hide dropzone:
    this._tokenHoveringAbove(false, 0.0);

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
    var indicator_tween = this.game.add.tween(indicator).to( {alpha: 0.5}, time, Phaser.Easing.Quadratic.InOut, true);
    
    // animate the coin, etc:
    indicator_tween.onComplete.add(function() {
        this.events.onCardAnswered.dispatch(this, this.correct);
    }, this);

    //jump through some hoops to tween a color
    //var dropzone = this.dropzone;
    //var startColor = this.dropzone.tint;
    //var colorTweenCounter = { step: 0 };
    //var colorTween = this.game.add.tween(colorTweenCounter).to( { step: 1 }, time, Phaser.Easing.Quadratic.InOut, true);
    //colorTween.onUpdateCallback(function() {
    //    dropzone.tint = Phaser.Color.interpolateColor(startColor, targetColor, 1, colorTweenCounter.step);
    //});

    // animate the sticker border and do some fancy shenanigans if wrong answer:
    if (!this.correct) {
        // audio
        GLOBAL.audioManager.playSound("bonusGameIncorrectAnswerSound");

        // do sticker_border_incorrect:
        this.borderAnim.alpha = 1;
        var b_anim = this.borderAnim.play("sticker_border_incorrect");

        // do sticker splode, then puff:
        this.token.stickerAnim.alpha = 1; // reveal anim sprite
        var anim = this.token.stickerAnim.play("sticker_splode");
        if (anim) {
            anim.onComplete.addOnce(function() {
                // create new stickerCorrectedStatic with correct img:
                this.token.stickerCorrectedStatic = null;
                if (this.targetValue == "Just Right")
                    this.token.stickerCorrectedStatic = this.game.make.sprite(0, 0, "bonusCorrectionJustRight");
                else if (this.targetValue == "Too Much")
                    this.token.stickerCorrectedStatic = this.game.make.sprite(0, 0, "bonusCorrectionTooMuch");
                else // Not Enough
                    this.token.stickerCorrectedStatic = this.game.make.sprite(0, 0, "bonusCorrectionNotEnough");
                this.token.stickerCorrectedStatic.anchor.setTo(0.5, 0.5);
                this.token.stickerCorrectedStatic.alpha = 0; // init it hidden
                this.token.addChild(this.token.stickerCorrectedStatic);

                // animate the puff and bring to front:
                var anim_puff = this.token.stickerAnim.play("smoke_puff");
                this.token.stickerAnim.anchor.set(0.5, 0.75);
                this.token.addChild(this.token.stickerAnim);

                // 1/4 second later, reveal stickerCorrectedStatic under the puff, so when it's poofed and gone, you see it waiting there:
                this.game.time.events.add(Phaser.Timer.QUARTER, function() {
                    this.token.stickerStatic.alpha = 0; // hide original token
                    this.token.stickerCorrectedStatic.alpha = 1; // reveal corrected sticker
                }, this);

            }, this);
        }

        // OLD:
        // flip the coin by tweening the scale and changing the contents in the middle
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
        // audio
        GLOBAL.audioManager.playSound("bonusGameCorrectAnswerSound");

        // do sticker_border_correct:
        this.borderAnim.alpha = 1;
        var b_anim = this.borderAnim.play("sticker_border_correct");
    }
};

GlassLab.SortingGameCard.prototype._addSpriteDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var colWidth = 42, rowHeight = 35;
    var maxCols = 4;
    var creature_and_food_count = 0;
    this.displaySprite = this.game.make.sprite(colWidth / 2, rowHeight / 2 + 60);
    this.addChild(this.displaySprite);

    var foodLeft = {}; // track the total number of food left to split among all creatures

    var width = this.numCreatures * colWidth;
    var offset = (this.getWidth() - width) / 2;
    this.card_creatures = [];
    for (var i = 0; i < this.numCreatures; i++) {
        var creature = this.game.make.sprite(i * colWidth + offset, 0, creatureInfo.spriteName + "_sticker");
        creature.scale.setTo(0.45, 0.45);
        creature.anchor.setTo(0.5, 1.0);
        this.displaySprite.addChild(creature);

        // save to array of objs:
        this.card_creatures.push({
            obj: creature,
            orig_scale: 0.45,
            tween_start: null,
            tween_stop: null,
            tween_delay: (creature_and_food_count % 3) * 100
        });
        creature_and_food_count++;
    }

    var row, lastRow = 1;
    this.card_food = [];
    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        var width = Math.min(this.numFood[i], maxCols) * colWidth;
        var offset = (this.getWidth() - width) / 2;

        var foodType = creatureInfo.desiredFood[i].type;
        var foodInfo = GlassLab.FoodTypes[foodType];
        for (var j = 0; j < this.numFood[i]; j++) {
            var col = j % maxCols;
            row = Math.floor(j / maxCols) + lastRow;
            var food = this.game.make.sprite(col * colWidth + offset, row * rowHeight + 10, foodInfo.spriteName + "_sticker");
            food.scale.setTo(0.75, 0.75);
            food.anchor.setTo(0.5, 1.0);
            this.displaySprite.addChild(food);

            // save to array of objs:
            this.card_food.push({
                obj: food,
                orig_scale: 0.75,
                tween_start: null,
                tween_stop: null,
                tween_delay: (creature_and_food_count % 3) * 100
            });
            creature_and_food_count++;
        }
        lastRow = row + 1;
    }
};

GlassLab.SortingGameCard.prototype._addNumberDisplay = function() {
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(this.creatureType);

    var rowHeight = 60;
    var creature_and_food_count = 0;
    this.displaySprite = this.game.make.sprite(this.actualWidth / 2 - 40, rowHeight / 2 + 60);
    this.addChild(this.displaySprite);

    this.card_creatures = [];
    var creature = this.game.make.sprite(0, 0, creatureInfo.spriteName+"_sticker");
    creature.scale.setTo(0.6, 0.6);
    creature.anchor.setTo(0.5, 1.0);
    this.displaySprite.addChild(creature);

    // save to array of objs:
    this.card_creatures.push({
        obj: creature,
        orig_scale: 0.6,
        tween_start: null,
        tween_stop: null,
        tween_delay: (creature_and_food_count % 3) * 100
    });
    creature_and_food_count++;

    var label = this.game.make.text(36, (i+1) * rowHeight, "x " + this.numCreatures, {font: "36px EnzoBlack", fill: "#333"});
    label = GlassLab.Util.SetCenteredText(label, null, 0, 1.2);
    this.displaySprite.addChild(label);

    this.card_food = [];
    for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
        var foodInfo = GlassLab.FoodTypes[creatureInfo.desiredFood[i].type];
        var numFoods = this.numFood[i] || 0;
        if (numFoods) {
            var food = this.game.make.sprite(0, ((i+1) * rowHeight) + 10, foodInfo.spriteName + "_sticker");
            food.scale.setTo(1.0, 1.0);
            food.anchor.setTo(0.5, 1.0);
            this.displaySprite.addChild(food);

            // save to array of objs:
            this.card_food.push({
                obj: food,
                orig_scale: 1.0,
                tween_start: null,
                tween_stop: null,
                tween_delay: (creature_and_food_count % 3) * 100
            });
            creature_and_food_count++;

            var food_label = this.game.make.text(33, (i+1) * rowHeight, "x " + numFoods, {font: "36px EnzoBlack", fill: "#333"});
            food_label = GlassLab.Util.SetCenteredText(food_label, null, 0, 0.8);
            this.displaySprite.addChild(food_label);
        }
    }
};

GlassLab.SortingGameCard.prototype._tokenHoveringAbove = function(true_or_false, dropzone_alpha) {
    // start or stop hover animation:
    var degrees_per_radian = 180 / Math.PI;
    var cur_rot = this.dropzone.rotation;
    if (true_or_false) {
        // scale the dropzone (dotted line) and dropzone shade:
        var dropzone_scale_tween = this.game.add.tween(this.dropzone.scale)
            .to({x: 1.2, y: 1.2}, 150, Phaser.Easing.Quadratic.Out);
        dropzone_scale_tween.start();
        var dropzone_shade_scale_tween = this.game.add.tween(this.dropzoneShade.scale)
            .to({x: 1.2, y: 1.2}, 150, Phaser.Easing.Quadratic.Out);
        dropzone_shade_scale_tween.start();

        // set dropzone alpha:
        var dropzone_alpha_tween = this.game.add.tween(this.dropzone)
            .to({alpha: dropzone_alpha}, 150, Phaser.Easing.Linear.None);
        dropzone_alpha_tween.start();

        // spin it 30 degrees (converted to rads) and loop:
        var new_rot = cur_rot + (30 / degrees_per_radian);
        this.dropzone_tween = this.game.add.tween(this.dropzone)
            .to({rotation: new_rot}, 300, Phaser.Easing.Linear.None)
            .loop();
        this.dropzone_tween.start();

        // pulse the dropzoneShade:
        this.dropzone_shade_tween = this.game.add.tween(this.dropzoneShade)
            .to({alpha: 0.1}, 450, Phaser.Easing.Linear.None)
            .to({alpha: 0}, 450, Phaser.Easing.Linear.None)
            .loop();
        this.dropzone_shade_tween.start();

        // dance tweens:
        for (var c in this.card_creatures) {
            // create new tween:
            if (this.card_creatures[c].tween_start != null && this.card_creatures[c].tween_start.isRunning)
                this.card_creatures[c].tween_start.stop(); // stop immediately if its running.

            this.card_creatures[c].tween_start = this.game.add.tween(this.card_creatures[c].obj.scale)
                .to({y: this.card_creatures[c].orig_scale * 1.1}, 150, Phaser.Easing.Quadratic.Out)
                .to({y: this.card_creatures[c].orig_scale}, 150, Phaser.Easing.Quadratic.In)
                .loop();  

            // start it with a varying delay using closure:
            (function(game, creature_data) {
                game.time.events.add(creature_data.tween_delay, function() { creature_data.tween_start.start(); }, this);
            })(this.game, this.card_creatures[c]);
        }
        for (var f in this.card_food) {
            // create new tween:
            if (this.card_food[f].tween_start != null && this.card_food[f].tween_start.isRunning)
                this.card_food[f].tween_start.stop(); // stop immediately if its running.

            this.card_food[f].tween_start = this.game.add.tween(this.card_food[f].obj.scale)
                .to({y: this.card_food[f].orig_scale * 1.2}, 150, Phaser.Easing.Quadratic.Out)
                .to({y: this.card_food[f].orig_scale}, 150, Phaser.Easing.Quadratic.In)
                .loop();  

            // start it with a varying delay using closure:
            (function(game, food_data) {
                game.time.events.add(food_data.tween_delay, function() { food_data.tween_start.start(); }, this);
            })(this.game, this.card_food[f]);
        }
    }
    else {
        if (this.dropzone_tween != null) {
            // reset scale on dropzone and dropzoneShade:
            var dropzone_scale_tween = this.game.add.tween(this.dropzone.scale)
                .to({x: 1, y: 1}, 150, Phaser.Easing.Quadratic.Out);
            dropzone_scale_tween.start();
            var dropzone_shade_scale_tween = this.game.add.tween(this.dropzoneShade.scale)
                .to({x: 1, y: 1}, 150, Phaser.Easing.Quadratic.Out);
            dropzone_shade_scale_tween.start();

            // set dropzone alpha:
            var dropzone_alpha_tween = this.game.add.tween(this.dropzone)
                .to({alpha: dropzone_alpha}, 150, Phaser.Easing.Linear.None);
            dropzone_alpha_tween.start();

            // stop rotation loop and reset to nearest snap point:
            var cur_rot_snap = cur_rot + ((cur_rot * degrees_per_radian) % 30) / degrees_per_radian;
            this.dropzone_tween.stop();
            this.dropzone_tween = this.game.add.tween(this.dropzone)
                .to({rotation: cur_rot_snap}, 150, Phaser.Easing.Linear.None);
            this.dropzone_tween.start();

            // stop the dropzoneShade pulsing:
            this.dropzone_shade_tween.stop();
            this.dropzone_shade_tween = this.game.add.tween(this.dropzoneShade)
                .to({alpha: 0}, 150, Phaser.Easing.Linear.None);
            this.dropzone_shade_tween.start();

            // stop the dance tweens:
            for (var c in this.card_creatures) {
                // create new tween:
                this.card_creatures[c].tween_stop = this.game.add.tween(this.card_creatures[c].obj.scale)
                    .to({y: this.card_creatures[c].orig_scale}, 150, Phaser.Easing.Quadratic.In);

                // start it with a varying delay using closure:
                (function(game, creature_data) {
                    game.time.events.add(creature_data.tween_delay, function() {
                        if (creature_data.tween_start != null && creature_data.tween_start.isRunning)
                            creature_data.tween_start.stop(); // dont forget to stop the other!
                        creature_data.tween_stop.start();
                    }, this);
                })(this.game, this.card_creatures[c]);
            }
            for (var f in this.card_food) {
                // create new tween:
                this.card_food[f].tween_stop = this.game.add.tween(this.card_food[f].obj.scale)
                    .to({y: this.card_food[f].orig_scale}, 150, Phaser.Easing.Quadratic.In);

                // start it with a varying delay using closure:
                (function(game, food_data) {
                    game.time.events.add(food_data.tween_delay, function() {
                        if (food_data.tween_start != null && food_data.tween_start.isRunning)
                            food_data.tween_start.stop(); // dont forget to stop the other!
                        food_data.tween_stop.start();
                    }, this);
                })(this.game, this.card_food[f]);
            }
        }
    }
};

/**
 * SortingGameToken
 */

GlassLab.SortingGameToken = function(sortingGame, value) {
    GlassLab.UIDraggable.prototype.constructor.call(this, sortingGame.game);

    this.input.priorityID = GLOBAL.UIpriorityID;
    this.sortingGame = sortingGame;
    this.value = value;

    this.actualWidth = this.actualHeight = 100;
    this.hitArea = new Phaser.Circle(0, 0, this.actualWidth); // very important!

    // token image and sticker anims
    this.stickerStatic = null;
    this.stickerAnim = this.game.make.sprite(0, 0, "bonusAnims");
    if (value == "Just Right") {
        this.stickerStatic = this.game.make.sprite(0, 0, "bonusJustRight");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_just_right_",267,285,".png",3), 24, false);
    }
    else if (value == "Too Much") {
        this.stickerStatic = this.game.make.sprite(0, 0, "bonusTooMuch");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_too_much_",267,285,".png",3), 24, false);
    }
    else { // Not Enough
        this.stickerStatic = this.game.make.sprite(0, 0, "bonusNotEnough");
        this.stickerAnim.animations.add("sticker_splode",
            Phaser.Animation.generateFrameNames("bonus_sticker_splode_not_enough_",267,285,".png",3), 24, false);
    }

    // add sticker overlay (to be tinted white or black and appear at low alpha values during various mouseover+drag states):
    this.stickerOverlay = this.game.make.sprite(0, 0, "bonusStickerOverlay");

    // add smoke_puff, sticker_border_correct, sticker_border_incorrect:
    this.stickerAnim.animations.add("smoke_puff",
        Phaser.Animation.generateFrameNames("smoke_puff_bonus_game_",282,312,".png",3), 24, false);

    this.stickerStatic.anchor.setTo(0.5, 0.5);
    this.addChild(this.stickerStatic);
    this.stickerOverlay.anchor.setTo(0.5, 0.5);
    this.stickerOverlay.alpha = 0;
    this.addChild(this.stickerOverlay);
    this.stickerAnim.anchor.set(0.5, 0.5);
    this.stickerAnim.alpha = 0;
    this.addChild(this.stickerAnim);


    // hoverLabel above token (show on hover):
    this.hoverLabelContainer = this.game.make.group();
    this.hoverLabelContainer.y = -35;
    this.hoverLabelContainer.alpha = 0;
    this.hoverLabelContainerScaleTween = null;
    this.hoverLabelContainerAlphaTween = null;
    var hoverLabelY = -27; // center of words/labelBg etc is 37 px above container bottom
    
    this.hoverLabel = this.game.make.text(0, hoverLabelY + 2, value, {fill: '#ffffff', font: "16px EnzoBlack"});

    this.hoverLabelBg = this.game.make.image(0, hoverLabelY, "foodLabelBg");
    this.hoverLabelBg._original_width = this.hoverLabelBg.width;
    this.hoverLabelBg.anchor.setTo(.5, .5);
    this.hoverLabelBg.tint = 0x000000;
    this.hoverLabelBg.alpha = 0.75;

    this.hoverLabelBgEndcapLeft = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapLeft.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapLeft.tint = 0x000000;
    this.hoverLabelBgEndcapLeft.alpha = 0.75;

    this.hoverLabelBgEndcapRight = this.game.make.image(0, hoverLabelY, "foodLabelBgEndcap");
    this.hoverLabelBgEndcapRight.anchor.setTo(1, .5);
    this.hoverLabelBgEndcapRight.scale.x *= -1;
    this.hoverLabelBgEndcapRight.tint = 0x000000;
    this.hoverLabelBgEndcapRight.alpha = 0.75;

    this.hoverLabelBgPointer = this.game.make.image(0, hoverLabelY + 22, "questObjectiveArrow");
    this.hoverLabelBgPointer.anchor.setTo(.5, .5);
    this.hoverLabelBgPointer.scale.y *= -1;
    this.hoverLabelBgPointer.tint = 0x000000;
    this.hoverLabelBgPointer.alpha = 0.75;

    // calculates sizes, scales, text anchors, etc of various components of the hoverLabel:
    this.hoverLabel = GlassLab.Util.SetCenteredText(this.hoverLabel, null, 0.5, 0.5);
    this.hoverLabelBg.scale.x = (this.hoverLabel.width + 30) / this.hoverLabelBg._original_width; // 15px padding before endcaps
    this.hoverLabelBgEndcapLeft.x = 0 - (this.hoverLabel.width/2 + 15);
    this.hoverLabelBgEndcapRight.x = this.hoverLabel.width/2 + 15;

    // add hoverLabel parts as children:
    this.hoverLabelContainer.addChild(this.hoverLabelBg);
    this.hoverLabelContainer.addChild(this.hoverLabelBgEndcapLeft);
    this.hoverLabelContainer.addChild(this.hoverLabelBgEndcapRight);
    this.hoverLabelContainer.addChild(this.hoverLabelBgPointer);
    this.hoverLabelContainer.addChild(this.hoverLabel);

    // add group as child to this:
    this.addChild(this.hoverLabelContainer);

    this.hoverTarget = null; // pointer to target currently hovering over, if any
    this.dropValidator = function(target) { return (target instanceof GlassLab.SortingGameCard); };
    this.events.onDrop.add(this._onDrop, this);
    this.events.onStartDrag.add(this._onStartDrag, this);
    
    this.events.onInputOver.add(this._onOver, this);
    this.events.onInputOut.add(this._onOut, this);
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

GlassLab.SortingGameToken.prototype._onComponentDragged = function(mousePoint, diff) {
    // target doesn't move - so check only when token moves:
    if (diff.x != 0 || diff.y != 0) {
        // check for overlap of a target:
        var target = GLOBAL.UIManager.getDragTarget(this);
        var can_drop = this.canDropOnto(target);
        //console.log("_onComponentDragged can Drop?:", canDrop);

        if (can_drop) {
            if (this.hoverTarget != target) {
                target._tokenHoveringAbove(true, 1.0); // start hover effect on new target
                if (this.hoverTarget != null)
                    this.hoverTarget._tokenHoveringAbove(false, 1.0); // stop hover effect on old target
                this.hoverTarget = target; // set pointer
            }
        }
        else {
            if (this.hoverTarget != null)
                this.hoverTarget._tokenHoveringAbove(false, 1.0); // stop hover effect on old target
            this.hoverTarget = null; // set pointer
        }
        
    }

    // move token:
    this.x = mousePoint.x;
    this.y = mousePoint.y;
};

GlassLab.SortingGameToken.prototype._showTooltip = function(yes_or_no) {
    // stop any tweening of the hoverlabel container if there is any:
    if (this.hoverLabelContainerScaleTween != null && this.hoverLabelContainerScaleTween.isRunning)
        this.hoverLabelContainerScaleTween.stop();
    if (this.hoverLabelContainerAlphaTween != null && this.hoverLabelContainerAlphaTween.isRunning)
        this.hoverLabelContainerAlphaTween.stop();

    if (yes_or_no) {
        // set hoverLabelContainer scale and tween alpha and scale to 1.
        this.hoverLabelContainer.scale.y = 0;
        this.hoverLabelContainerScaleTween = this.game.add.tween(this.hoverLabelContainer.scale)
            .to({y: 1}, 200, Phaser.Easing.Elastic.Out, true);
        this.hoverLabelContainerAlphaTween = this.game.add.tween(this.hoverLabelContainer)
            .to({alpha: 1}, 75, Phaser.Easing.Quadratic.Out, true);
    }
    else {
        // tween hoverLabelContainer alpha and scale to 0.
        this.hoverLabelContainerScaleTween = this.game.add.tween(this.hoverLabelContainer.scale)
            .to({y: 0}, 75, Phaser.Easing.Quadratic.Out, true);
        this.hoverLabelContainerAlphaTween = this.game.add.tween(this.hoverLabelContainer)
            .to({alpha: 0}, 75, Phaser.Easing.Quadratic.Out, true);
    }
};

GlassLab.SortingGameToken.prototype._applyDragEffect = function() {
    this.scale.x *= 1.05;
    this.scale.y *= 1.05;
    this.parent._draggingToken = true;

    // dark overlay at 10%:
    this.stickerOverlay.tint = 0x000000;
    this.stickerOverlay.alpha = 0.1;

    // hide hoverLabel:
    this._showTooltip(false);
};

GlassLab.SortingGameToken.prototype._removeDragEffect = function() {
    this.scale.x /= 1.05;
    this.scale.y /= 1.05;
    this.parent._draggingToken = false;

    // remove overlay:
    this.stickerOverlay.alpha = 0;
};

GlassLab.SortingGameToken.prototype._onOver = function() {
    // light overlay at 15%:
    this.stickerOverlay.tint = 0xffffff;
    this.stickerOverlay.alpha = 0.15;

    // show hoverLabel only if at start point:
    if (!this.parent._draggingToken && this._at_start_point) this._showTooltip(true);
};
GlassLab.SortingGameToken.prototype._onOut = function() {
    // remove overlay:
    this.stickerOverlay.alpha = 0;

    // hide hoverLabel:
    this._showTooltip(false);
};
