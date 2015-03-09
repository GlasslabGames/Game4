/**
 * Created by Jerry Fu on 2/18/2015.
 */

var GlassLab = GlassLab || {};

/**
 * RewardPopup
 */
/* Example order info:
 {
 client: "Archibold Huxley III",
 company: "Rupture Farms",
 numCreatures: 7,
 type: "rammus",
 description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
 fulfilled: false,
 reward: 200
 }
 */

GlassLab.RewardPopup = function(game, x, y)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, x, y);

    var photo = this.game.make.graphics(230, -70);
    photo.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-90, -100, 180, 200);
    photo.angle = 10;
    this.addChild(photo);

    this.creature = this.game.make.sprite(0, 30, "unicorn_idle");
    this.creature.scale.setTo(-0.25, 0.25);
    this.creature.anchor.setTo(0.5, 0.5);
    photo.addChild(this.creature);

    this.emote = this.game.make.sprite(0, -70, "happyEmote");
    this.emote.scale.setTo(-0.5, 0.5);
    this.emote.anchor.setTo(0.5, 0.5);
    photo.addChild(this.emote);

    this.button = new GlassLab.UIRectButton(this.game, 0, 0, this.finish, this, 250, 50, 0xffffff, "Collect Payment!");//, fontsize);
    this.modal = new GlassLab.UIModal(this.game, "", this.button);
    this.modal.label.style.font = "bold 14pt Arial";
    this.addChild(this.modal);
    this.modal.maxLabelWidth = 300;

    this.headerBg = this.game.make.graphics();
    this.addChild(this.headerBg);

    this.headerLabel = this.game.make.text(0, 0, "Order Failed!", {font: "bold 14pt Arial"});
    this.headerLabel.anchor.setTo(0.5, 0.5);
    this.headerBg.addChild(this.headerLabel);

    this.closeButton = this.game.make.sprite(0, 0, "bigX");
    this.closeButton.tint = 0x000000;
    this.closeButton.anchor.setTo(0.5, 0.5);
    this.closeButton.scale.setTo(0.12, 0.12);
    this.headerBg.addChild(this.closeButton);
    this.closeButton.inputEnabled = true;
    this.closeButton.events.onInputUp.add(this.finish, this);
};

GlassLab.RewardPopup.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.RewardPopup.prototype.constructor = GlassLab.RewardPopup;

GlassLab.RewardPopup.prototype.Show = function(data)
{
    this.data = data;
    this.visible = true;
    this.reward = (data.fulfilled? data.reward : 0);
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(data.type);

    this.button.label.text = (data.fulfilled? "Collect Payment!" : "I'll do better next time!");

    var string = "From the desk of:\n" + data.client + "\n\n";
    var name = creatureInfo.displayNames.plural;

    if (data.fulfilled) {
        // TODO: include display name in creature info, and use it here
        string += "All my "+ name + " arrived safe and sound! Your full payment is enclosed. It was a pleasure doing business with you."
    } else {
        string += "The "+ name + " you sent weren't fed correctly, and now they're all angry! I won't be paying you for this unacceptable situation. Next time, please make sure the amount of food is appropriate for the number of creatures you send."
    }
    string += "\n\nPayment received:\n$" + this.reward;

    this.modal.setText( string, true );

    this.headerBg.y = -this.modal.getHeight() / 2 - 20;
    this.headerBg.clear();
    this.headerBg.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(-0.5 * this.modal.getWidth(),-20,this.modal.getWidth(), 40);

    this.closeButton.x = 0.5 * this.modal.getWidth() - 30;

    this.headerLabel.text = (data.fulfilled? "Order Fulfilled!" : "Order Failed!");

    if (this.creature.spriteName != creatureInfo.spriteName + "_idle") this.creature.loadTexture(creatureInfo.spriteName + "_idle");
    var emoteSpriteName = (data.fulfilled? "happyEmote" : "angryEmote");
    if (this.emote.spriteName != emoteSpriteName) this.emote.loadTexture(emoteSpriteName);

    if (data.fulfilled) {
        GLOBAL.audioManager.playSound("success");
    } else {
        GLOBAL.audioManager.playSound("fail");
    }

};

GlassLab.RewardPopup.prototype.Hide = function()
{
    this.visible = false;
    if (this.data && this.data.fulfilled) { // they closed it after successfully filling in order, so count it as a completed challenge
        GLOBAL.questManager.completeChallenge();
    }
};

GlassLab.RewardPopup.prototype.finish = function() {
    GLOBAL.inventoryManager.AddMoney(this.reward);
    this.Hide();
};