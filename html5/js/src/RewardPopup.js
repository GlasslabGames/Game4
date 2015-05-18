/**
 * Created by Jerry Fu on 2/18/2015.
 */

var GlassLab = GlassLab || {};

/**
 * RewardPopup
 */
GlassLab.RewardPopup = function(game)
{
    GlassLab.UIWindow.prototype.constructor.call(this, game);

    // Note that a lot of this is the same as OrdersMenu.js . I don't think it was worth making a subclass, but maybe I should
    this.bg = game.make.sprite(0, 0, "letterBg");
    this.bg.anchor.setTo(0.5, 0.5);
    this.bg = GlassLab.Util.PixelSnapAnchor(this.bg);
    this.addChild(this.bg);

    this.portrait = game.make.sprite(-95, -150, "clientPhoto3");
    this.portrait.anchor.setTo(.5, .5);
    this.portrait = GlassLab.Util.PixelSnapAnchor(this.portrait);
    this.addChild(this.portrait);

    var fontStyle = {font: '11pt AmericanTypewriter', fill: "#807c7b"};
    var infoX = 5;

    var receiptBg = game.make.sprite(-50, 105, "receiptBg");
    this.addChild(receiptBg);
    this.creatureEntry = receiptBg.addChild(new GlassLab.RewardReceiptEntry(this.game, 30, 60, true));
    this.foodAEntry = receiptBg.addChild(new GlassLab.RewardReceiptEntry(this.game, 120, 60));
    this.foodBEntry = receiptBg.addChild(new GlassLab.RewardReceiptEntry(this.game, 120, 95));

    this.clientLabel = game.make.text(infoX, -220, "From the desk of", fontStyle);
    this.addChild(this.clientLabel);
    this.clientNameLabel = game.make.text(infoX, this.clientLabel.y + 20, "Archibold Huxley I", fontStyle);
    this.addChild(this.clientNameLabel);

    var coin = game.make.sprite(infoX, this.clientNameLabel.y + 70, "bigCoin");
    coin.anchor.setTo(0, 0.5);
    this.addChild(coin);
    this.rewardAmountLabel = game.make.text(coin.x + coin.width + 10, coin.y, "$500", {font: '16pt AmericanTypewriter', fill: "#807c7b"});
    this.rewardAmountLabel.anchor.setTo(0, 0.5);
    this.addChild(this.rewardAmountLabel);

    this.descriptionLabel = game.make.text(-165, -40, "Dear Rancher,\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent maximus, risus quis dignissim lacinia, tellus eros facilisis nulla, vulputate laoreet erat nisl sit amet sem. Nam eget est a erat rhoncus consequat.\n\nKindest Regards, Archie H.",
        {wordWrap: true, wordWrapWidth: 330, font: '11pt AmericanTypewriter', fill: "#807c7b"});
    this.addChild(this.descriptionLabel);

    this.coinSparkle = this.addChild(game.make.sprite(coin.x + 20, coin.y, "coinAnim"));
    this.coinSparkle.anchor.setTo(0.5, 0.5);
    this.coinSparkle.animations.add("sparkle", Phaser.Animation.generateFrameNames("get_money_sparkle_on_letter_",0,20,".png",3), 24);

    this.onFinishedShowing.add(this.addReward, this); // add the reward as soon as the letter fully pops up
};

GlassLab.RewardPopup.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.RewardPopup.prototype.constructor = GlassLab.RewardPopup;

GlassLab.RewardPopup.prototype.show = function(data)
{
    this.data = data;
    var success = data.outcome == GlassLab.results.satisfied;
    this.reward = (success)? data.reward : 0;
    // Note, we want to set this.reward before calling UIWindow.show since it might trigger this.addRewards immediately (if for some reason we're showing this popup already.)

    GlassLab.UIWindow.prototype.show.call(this);

    this.clientNameLabel.text = data.client;
    this.rewardAmountLabel.text = "$"+this.reward;

    var creatureAsk = !("numCreatures" in this.data); // the player had to fill in the amount of creatures
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(data.creatureType);

    // There's a special case where 1 of the 2 food types is asked for and the number of creatures is asked for as well.
    var singleProvidedFood = null; // when this is set, it means the other food was asked for.
    if (creatureAsk && creatureInfo.desiredFood.length > 1) {
        if ("numFoodA" in this.data) singleProvidedFood = creatureInfo.desiredFood[0].type;
        if ("numFoodB" in this.data) {
            if (singleProvidedFood) singleProvidedFood = null; // if both numFoodA and numFoodB are provided, there's no singleProvided food
            else singleProvidedFood = creatureInfo.desiredFood[1].type;
        }
    }

    var creatures = creatureInfo.displayNames.plural;
    var detail = data.outcomeDetail;
    var foodNames = (detail && GlassLab.FoodTypes[detail[0]] && GlassLab.FoodTypes[detail[0]].displayNames) || {singular: "food", plural: "food"};
    var uncountable = (foodNames.plural == foodNames.singular); // e.g. "meat" is uncountable, "apples" is not

    if (singleProvidedFood) {
        var providedFoodName = GlassLab.FoodTypes[singleProvidedFood].displayNames.plural.toLowerCase();
        var providedUncountable = (GlassLab.FoodTypes[singleProvidedFood].displayNames.plural == GlassLab.FoodTypes[singleProvidedFood].displayNames.singular);
    }

    var photo = creatureInfo.spriteName + "_orderPhoto_";
    var string = "Dear Rancher," + "\n\n";

    switch (data.outcome) {
        case GlassLab.results.satisfied:
            string += "All the "+ creatures + " you sent arrived safe and sound! Your full payment is enclosed. It was a pleasure doing business with you.";
            photo += "happy";
            break;
        case GlassLab.results.dislike:
            string += "You didn't send the correct kind of food for these "+ creatures + "!";
            photo += "wrongFood";
            break;
        case GlassLab.results.sick:
            if (creatureAsk) {
                string += "You sent too few " + creatures + " to eat all ";
                if (singleProvidedFood) string += (providedUncountable? "this ":"these ") + providedFoodName + ",";
                else string += "this food,";
            } else string += "You sent too "+(uncountable? "much ":"many ")+foodNames.plural.toLowerCase()+" for these " + creatures + " to eat,";
            string += " so they got sick!";
            photo += "vomit";
            break;
        case GlassLab.results.hungry:
            if (creatureAsk) {
                string += "You sent too many " + creatures + " and there ";
                if (singleProvidedFood) string += (providedUncountable? "wasn't enough ":"weren't enough ") + providedFoodName;
                else string += "wasn't enough food";
                string += " for all of them,";
            } else string += "You didn't send enough "+foodNames.plural.toLowerCase()+" for all of these "+ creatures + ",";
            string += " so they're still hungry!";
            photo += "cry";
            break;
        case GlassLab.results.wrongCreatureNumber:
            string += "I asked you to send the correct number of "+ creatures + " to eat "+ this.data.totalNumFood +" total food, but you sent too "+data.outcomeDetail+" "+ creatures + "!";
            photo += "cry";
            break;
        case GlassLab.results.wrongTotalFood:
            string += "You wrote on the Packing Slip that your shipment contained "+detail+" total food, but you didn't actually send that amount!";
            photo += "cry";
            break;
        case GlassLab.results.wrongFoodSum:
            string += "I asked you to send " + this.data.totalNumFood + " total food, but you sent "+ data.outcomeDetail +"total food instead!";
            photo += "cry";
            break;
    }

    // Now if the result was sick or hungry, we might need to include info about the second kind of food as well.
    if (data.outcome == GlassLab.results.sick || data.outcome == GlassLab.results.hungry) {
        var wrongFoodType;
        if (!creatureAsk && detail[1] && GlassLab.FoodTypes[detail[1]]) wrongFoodType = detail[1];
        else if (singleProvidedFood) wrongFoodType = detail[1];
        if (wrongFoodType) string += " The amount of "+GlassLab.FoodTypes[wrongFoodType].displayNames.plural.toLowerCase()+" wasn't right either!";
    }

    if (data.outcome != GlassLab.results.satisfied) {
        string += " I’m afraid I can’t pay you for this unacceptable situation.";
    }

    // To make the name fit, we're going to get its initials here. We might need to consider another solution later.
    var name = data.client;
    if (name.length > 15) {
        var nameParts = data.client.split(" ");
        var initials = "";
        var lastName = "";
        for (var i = 0; i < nameParts.length; i++) {
            if (/^[IVX]+$/.test(nameParts[i])) continue; // skip roman numerals (II, IV, etc)
            lastName = nameParts[i];
            initials += nameParts[i].substr(0, 1) + ". ";
        }
        name = initials.substr(0, initials.length - 3) + lastName; // try with the full last name
        if (name.length > 15) name = initials; // just initials then
    }

    string += "\n\nSincerely,\n" + name;

    GlassLab.Util.SetColoredText(this.descriptionLabel, string, "#807c7b", "#994c4e");

    this.portrait.loadTexture(photo);

    // Now we need to set up the receipt. First set the shipped type and amount for each
    this.creatureEntry.set(data.creatureType, data.shipped.numCreatures, true, true);
    this.foodAEntry.set(data.shipped.foodTypeA, data.shipped.numFoodA, true, true);
    this.foodBEntry.set(data.shipped.foodTypeB, data.shipped.numFoodB, true, true); // if foodTypeB is null, the entry will be hidden

    // Then show an X over the entries that were wrong.
    if (data.outcome == GlassLab.results.dislike) { // at least one of the food types was wrong, so check both
        var checkIfDesiredFood = function(foodType) {
            for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
                if (creatureInfo.desiredFood[i].type == foodType) return true;
            }
            return false;
        };
        if (!checkIfDesiredFood(data.shipped.foodTypeA)) this.foodAEntry.setX(false, true);
        if (!checkIfDesiredFood(data.shipped.foodTypeB)) this.foodBEntry.setX(false, true);
    } else if (data.outcome == GlassLab.results.wrongCreatureNumber) { // this is the case where they used the right ratio, but not one that matched the given totalFood
        this.creatureEntry.setX(true, false);
    } else if (data.outcome != GlassLab.results.satisfied) { // else if something else wrong
        // The creature is the one that's wrong if it's not total food, or there were no food entries, or the food they entered matches the total food.
        if (creatureAsk && (!data.totalNumFood || data.noFoodEntries || (data.shipped.numFoodA + (data.shipped.numFoodB || 0) == data.totalNumFood))) {
            // if it's wrong, and they had to fill in the number of creatures, they must have got that wrong
            this.creatureEntry.setX(true, false);
        } else { // One or both foods were wrong, so check the details (problemFoods) to find out which ones
            for (var i = 0; i < detail.length; i++) {
                if (detail[i] == this.data.shipped.foodTypeA) this.foodAEntry.setX(true, false);
                else if (detail[i] == this.data.shipped.foodTypeB) this.foodBEntry.setX(true, false);
            }
        }
    }

    if (success) {
        GLOBAL.audioManager.playSound("successSound");
    } else {
        GLOBAL.audioManager.playSound("failSound");
    }

    GlassLab.SignalManager.mailOpened.dispatch(); // eh, not sure we should be using this event :?

};

GlassLab.RewardPopup.prototype.addReward = function() {
    if (!this.reward) return;

    GLOBAL.inventoryMoneyTab.show("moneyChange"); // indicate that the money should be shown as until we're done adding money

    // If the screen is right size, we can use the flying coin animation - it fits an 800x600 screen only
    if (this.game.width == 800 && this.game.height == 600) {
        this.coinSparkle.play("sparkle");
        GLOBAL.UIManager.startFlyingCoins(function() {
            GLOBAL.inventoryManager.AddMoney(this.reward); // only add the money when the flying coins reach the bank
        }, this);
    } else { // no flying coins, just add the money
        GLOBAL.inventoryManager.AddMoney(this.reward);
    }
};

GlassLab.RewardPopup.prototype.hide = function()
{
    GlassLab.UIWindow.prototype.hide.call(this);

    GLOBAL.UIManager.hideFlyingCoins(); // hide coins even if they were in the middle of an animation

    if (this.data) {
        // Since the reward popup shows the results of an order, closing it is the final step in resolving an order
        GlassLab.SignalManager.orderResolved.dispatch(this.data, (this.data.outcome == GlassLab.results.satisfied));
        this.data = null; // this makes sure that when we hide the popup again, we don't count it as another order resolved
    }

    GlassLab.SignalManager.mailClosed.dispatch();
};

GlassLab.RewardPopup.prototype.finish = function() {
    this.hide();
};

/**
 * RewardReceiptEntry
 */
GlassLab.RewardReceiptEntry = function(game, x, y, isCreature) {
    Phaser.Sprite.prototype.constructor.call(this, game, x, y);

    var tempSprite = (isCreature)? "babyram_sticker" : "broccoli_sticker";
    this.sprite = this.addChild(game.make.sprite(0, 0, tempSprite));
    var scale = (isCreature)? 0.3 : 0.6;
    this.sprite.scale.setTo(scale, scale);
    this.sprite.anchor.setTo(0, 0.5);

    this.xLabel = this.addChild(game.make.text(this.sprite.width + 5, 5, "x ", {font: "12pt ArchitectsDaughter", fill: "#807c7b"}));
    this.xLabel.anchor.setTo(0, 0.5);
    this.label = this.addChild(game.make.text(this.xLabel.x + this.xLabel.width, 5, "16", {font: "12pt ArchitectsDaughter", fill: "#807c7b"}));
    this.label.anchor.setTo(0.5, 0.5);

    this.xMark = this.addChild(game.make.sprite(5, 0, "receiptX"));
    this.xMark.anchor.setTo(0.5, 0.5);

    this.isCreature = isCreature;
};

GlassLab.RewardReceiptEntry.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.RewardReceiptEntry.prototype.constructor = GlassLab.RewardReceiptEntry;

GlassLab.RewardReceiptEntry.prototype.set = function(type, number, typeIsCorrect, numberIsCorrect) {
    this.visible = type;
    if (!type) return;

    var key;
    if (this.isCreature) key = GLOBAL.creatureManager.GetCreatureData(type).spriteName + "_sticker";
    else key = GlassLab.FoodTypes[type].spriteName + "_sticker";
    this.sprite.loadTexture(key);

    this.label.text = number;
    this.label.x = this.xLabel.x + this.xLabel.width + (this.label.width / 2);
    GlassLab.Util.SetCenteredText(this.label, number);

    this.setX(typeIsCorrect, numberIsCorrect);
};

GlassLab.RewardReceiptEntry.prototype.setX = function(typeIsCorrect, numberIsCorrect) {
    if (!typeIsCorrect) {
        this.xMark.visible = true;
        this.xMark.x = 15;
    } else if (!numberIsCorrect) {
        this.xMark.visible = true;
        this.xMark.x = this.label.x;
    } else {
        this.xMark.visible = false;
    }
};