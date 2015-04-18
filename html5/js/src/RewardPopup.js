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

    var coin = game.make.sprite(infoX, this.clientNameLabel.y + 75, "bigCoin");
    coin.anchor.setTo(0, 0.5);
    this.addChild(coin);
    this.rewardAmountLabel = game.make.text(infoX + coin.width + 5, coin.y, "$500", {font: '16pt AmericanTypewriter', fill: "#807c7b"});
    this.rewardAmountLabel.anchor.setTo(0, 0.5);
    this.addChild(this.rewardAmountLabel);

    this.descriptionLabel = game.make.text(-165, -40, "Dear Rancher,\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent maximus, risus quis dignissim lacinia, tellus eros facilisis nulla, vulputate laoreet erat nisl sit amet sem. Nam eget est a erat rhoncus consequat.\n\nKindest Regards, Archie H.",
        {wordWrap: true, wordWrapWidth: 330, font: '11pt AmericanTypewriter', fill: "#807c7b"});
    this.addChild(this.descriptionLabel);
};

GlassLab.RewardPopup.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.RewardPopup.prototype.constructor = GlassLab.RewardPopup;

GlassLab.RewardPopup.prototype.show = function(data)
{
    GlassLab.UIWindow.prototype.show.call(this);

    this.data = data;
    this.visible = true;
    this.reward = (data.outcome == "satisfied")? data.reward : 0;
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(data.creatureType);

    this.clientNameLabel.text = data.client;
    this.rewardAmountLabel.text = "$"+this.reward;

    var string = "Dear Rancher," + "\n\n";
    var name = creatureInfo.displayNames.plural;

    if (data.outcome == "satisfied") {
        string += "All my "+ name + " arrived safe and sound! Your full payment is enclosed. It was a pleasure doing business with you."
    } else if (data.outcome == "wrongNumCreatures") {
        string += "You didn't send me the amount of food and creatures that I asked for! I won't be paying you for this unacceptable situation. Next time, please make sure the amount of food and creatures align to my request."
    } else {
        string += "The "+ name + " you sent weren't fed correctly, and now they're all angry! I won't be paying you for this unacceptable situation. Next time, please make sure the amount of food is appropriate for the number of creatures you send."
    }
    string += "\n\nSincerely,\n" + data.client;

    GlassLab.Util.SetColoredText(this.descriptionLabel, string, "#807c7b", "#994c4e");

    var photo = creatureInfo.spriteName + "_orderPhoto_" + ((data.outcome == "satisfied")? "satisfied" : "fail");
    this.portrait.loadTexture(photo);

    if (data.outcome == "satisfied") {
        GLOBAL.audioManager.playSound("successSound");
    } else {
        GLOBAL.audioManager.playSound("failSound");
    }

    GLOBAL.inventoryManager.AddMoney(this.reward); // todo: only add this after an animation plays

    GlassLab.SignalManager.mailOpened.dispatch(); // eh, not sure we should be using this event :?

};

GlassLab.RewardPopup.prototype.hide = function()
{
    GlassLab.UIWindow.prototype.hide.call(this);

    if (this.data) {
        // Since the reward popup shows the results of an order, closing it is the final step in resolving an order
        GlassLab.SignalManager.orderResolved.dispatch(this.data, (this.data.outcome == "satisfied"));
    }

    GlassLab.SignalManager.mailClosed.dispatch();
};

GlassLab.RewardPopup.prototype.finish = function() {
    this.hide();
};