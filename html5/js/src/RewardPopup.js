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
    this.addChild(this.bg);

    this.portrait = game.make.sprite(-95, -150, "bossmanPhoto");
    this.portrait.anchor.setTo(.5, .5);
    this.addChild(this.portrait);

    var fontStyle = {font: '11pt AmericanTypewriter', fill: "#807c7b"};
    var infoX = 5;

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
    var creatures = creatureInfo.displayNames.plural;
    var detail = data.outcomeDetail;
    var foodNames = (GlassLab.FoodTypes[detail] && GlassLab.FoodTypes[detail].displayNames) || {singular: "food", plural: "food"};
    var uncountable = (foodNames.plural == foodNames.singular); // e.g. "meat" is uncountable, "apples" is not

    var string = "Dear Rancher," + "\n\n";
    var photo = creatureInfo.spriteName + "_orderPhoto_";
    // TODO: set the food name

    switch (data.outcome) {
        case GlassLab.results.satisfied:
            string += "All the "+ creatures + " you sent arrived safe and sound! Your full payment is enclosed. It was a pleasure doing business with you.";
            photo += "happy";
            break;
        case GlassLab.results.sick:
            if (creatureAsk) string += "You sent too few " + creatures + " to eat all "+(uncountable? "this ":"these ")+foodNames.plural.toLowerCase()+",";
            else string += "You sent too "+(uncountable? "much ":"many ")+foodNames.plural.toLowerCase()+" for these " + creatures + " to eat,";
            string += " so they got sick! I’m afraid I can’t pay you for this unacceptable situation.";
            photo += "vomit";
            break;
        case GlassLab.results.hungry:
            if (creatureAsk) string += "You sent too many " + creatures + " and there "+(uncountable? "wasn't" : "weren't")+" enough "+foodNames.plural.toLowerCase()+" for all of them,";
            else string += "You didn't send enough "+foodNames.plural.toLowerCase()+" for all of these "+ creatures + ",";
            string += " so they're still hungry! I’m afraid I can’t pay you for this unacceptable situation.";
            photo += "cry";
            break;
        case GlassLab.results.dislike:
            string += "You didn't send the correct food types for these "+ creatures + "! I’m afraid I can’t pay you for this unacceptable situation.";
            photo += "wrongFood";
            break;
        case GlassLab.results.wrongCreatureNumber:
            var numTotalFood = this.data.totalNumFood || "some";
            string += "I asked you to send the correct number of "+ creatures + " to eat "+ numTotalFood +" total food, but you sent too "+data.outcomeDetail+" "+ creatures + "!";
            string += " I’m afraid I can’t pay you for this unacceptable situation.";
            photo += "cry";
            break;
    }
    string += "\n\nSincerely,\n" + data.client;

    GlassLab.Util.SetColoredText(this.descriptionLabel, string, "#807c7b", "#994c4e");

    this.portrait.loadTexture(photo);

    if (success) {
        GLOBAL.audioManager.playSound("successSound");
    } else {
        GLOBAL.audioManager.playSound("failSound");
    }

    GlassLab.SignalManager.mailOpened.dispatch(); // eh, not sure we should be using this event :?

};

GlassLab.RewardPopup.prototype.addReward = function() {
    if (!this.reward) return;

    // If the screen is right size, we can use the flying coin animation - it fits an 800x600 screen only
    if (this.game.width == 800 && this.game.height == 600) {
        this.coinSparkle.play("sparkle");
        GLOBAL.UIManager.startFlyingCoins(function() {
            GLOBAL.inventoryManager.AddMoney(this.reward); // only add the money when the flying coins reach the bank
        }, this);
    } else { // no flying coins, just add the money
        GLOBAL.inventoryManager.AddMoney(this.reward); // only add the money when the flying coins reach the bank
    }
};

GlassLab.RewardPopup.prototype.hide = function()
{
    GlassLab.UIWindow.prototype.hide.call(this);

    if (this.data) {
        // Since the reward popup shows the results of an order, closing it is the final step in resolving an order
        GlassLab.SignalManager.orderResolved.dispatch(this.data, (this.data.outcome == GlassLab.results.satisfied));
    }

    GlassLab.SignalManager.mailClosed.dispatch();
};

GlassLab.RewardPopup.prototype.finish = function() {
    this.hide();
};