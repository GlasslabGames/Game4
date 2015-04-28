/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    GlassLab.UIWindow.prototype.constructor.call(this, game);
    this.sprite = game.make.sprite(25, -50);
    this.addChild(this.sprite);

    this.bg = game.make.sprite(-25,30, "journalBg");
    this.bg.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.bg);

    this.alerts = game.make.sprite();
    this.sprite.addChild(this.alerts);

    // Creature Picture
    this.creatureSilhouette = game.make.sprite(0, 50);
    this.creatureSilhouette.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureSilhouette);

    this.creatureArt = game.make.sprite(0, 50);
    this.creatureArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureArt);

    // Creature info
    this.nameLabel = game.make.text(0, 50, "Species Unknown", {font: "14pt ArchitectsDaughter", fill: "#808080"});
    this.nameLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.nameLabel);

    /*
    var temperamentTitleLabel = game.make.text(-90, 100, "Temperament:", {font: "bold 14pt Arial"});
    temperamentTitleLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(temperamentTitleLabel);

    this.temperamentLabel = game.make.text(-90, 130, "Combative", {font: "bold 14pt Arial"});
    this.temperamentLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.temperamentLabel);
    */

    var dietTitleLabel = game.make.text(0, 100, "Daily Diet:", {font: "14pt ArchitectsDaughter", fill: "#808080"});
    //dietTitleLabel.anchor.setTo(0.5, 0);
    dietTitleLabel.x = -dietTitleLabel.width/2;
    this.sprite.addChild(dietTitleLabel);

    this.dailyDiet = game.make.sprite(20, 130);
    this.sprite.addChild(this.dailyDiet);

    this.unknownDietLabel = game.make.text(0, 140, "???", {font: "12pt ArchitectsDaughter", fill: "#808080"});
    this.unknownDietLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.unknownDietLabel);

    // Page buttons (almost the same as OrdersMenu)
    var pageButtonX = this.bg.width / 2 + 40;
    this.nextPageButtonHighlight = this.game.make.sprite(0,0, "sideArrowHighlight");
    this.nextPageButtonHighlight.anchor.setTo(.5, .5);
    this.nextPageButtonHighlight.tint = 0xCCCCCC;
    this.nextPageButton = new GlassLab.HUDButton(this.game, pageButtonX, -30, null, "sideArrow", "Next\nPage", {font: "12pt EnzoBlack"}, true, this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.label.x -= 8;
    this.bg.addChild(this.nextPageButton);
    this.nextPageButton.addChild(this.nextPageButtonHighlight);
    this.nextPageButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.nextPageButtonHighlight);
    this.nextPageButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.nextPageButtonHighlight);

    this.prevPageButtonHighlight = this.game.make.sprite(0,0, "sideArrowHighlight");
    this.prevPageButtonHighlight.anchor.setTo(.5, .5);
    this.prevPageButtonHighlight.tint = 0xCCCCCC;
    this.prevPageButtonHighlight.scale.x = -1;
    this.prevPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, -30, null, "sideArrow", "Prev\nPage", {font: "12pt EnzoBlack"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.bg.scale.x *= -1;
    this.prevPageButton.label.x += 8;
    this.bg.addChild(this.prevPageButton);
    this.prevPageButton.addChild(this.prevPageButtonHighlight);
    this.prevPageButton.events.onInputOver.add(function()
    {
        this.tint = 0xFFFFFF;
    }, this.prevPageButtonHighlight);
    this.prevPageButton.events.onInputOut.add(function()
    {
        this.tint = 0xCCCCCC;
    }, this.prevPageButtonHighlight);


    this.dailyDietTable = new GlassLab.UITable(this.game, 8, 5);
    this.dailyDietTable.y = 130;
    this.sprite.addChild(this.dailyDietTable);

    GlassLab.SignalManager.levelStarted.add(this._onLevelLoaded, this);
};

GlassLab.Journal.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.Journal.prototype.constructor = GlassLab.Journal;

GlassLab.Journal.FEED_NUM_COLUMNS = 7; // how many foods to display in a single row
GlassLab.Journal.MAX_ROW_LENGTH = 0;
GlassLab.Journal.UNIT_SIZE = 40;

GlassLab.Journal.prototype._onLevelLoaded = function(level)
{
    this.hide(true);
};

GlassLab.Journal.prototype.show = function(auto, creatureType)
{
    GlassLab.UIWindow.prototype.show.call(this);

    GlassLabSDK.saveTelemEvent((auto? "journal_shown" : "open_journal"), {});

    GLOBAL.inventoryMenu.hide(true);

    GLOBAL.audioManager.playSound("popUpSound");

    if (!creatureType) creatureType = this.wantToShow || GLOBAL.creatureManager.creatureList[this.currentPage || 0];
    // default to the page we last had open, or 0 if we haven't opened the journal yet
    this.RefreshWithCreature(creatureType);

    this.wantToShow = false; // only show it once per "wantToShow"

    GlassLab.SignalManager.journalOpened.dispatch(auto, creatureType);
};

GlassLab.Journal.prototype.RefreshWithCreature = function(creatureType)
{
    var creatureData = GLOBAL.creatureManager.GetCreatureData(creatureType);

    this.nameLabel.setText(creatureData.unlocked? creatureData.journalInfo.name : "Species Unknown");
    //this.temperamentLabel.setText(creatureData.unlocked? creatureData.journalInfo.temperament : "Unknown");

    if (creatureData.unlocked) {
        this.creatureArt.loadTexture(creatureData.spriteName+"_photo");
        this.creatureArt.tint = creatureData.spriteTint || 0xffffff;
    }
    if (!creatureData.unlocked || creatureData.unlocked == "new") {
        this.creatureSilhouette.loadTexture(creatureData.spriteName+"_mystery_photo");
    }

    // Ensure alpha is 1 since it might've gotten hidden by tweens
    this.creatureArt.visible = creatureData.unlocked;
    if (this.creatureArt.visible)
    {
        this.creatureArt.alpha = 1;
    }

    // Fill in the Daily Diet if we know it
    this.dailyDiet.visible = this.dailyDietTable.visible = creatureData.unlocked;
    this.unknownDietLabel.visible = !creatureData.unlocked;

    if (creatureData.unlocked) {
        if (creatureData.spriteName.indexOf("baby") != -1)
        {
            // Baby
            this._setupImageFeedLayout(creatureData);
        }
        else
        {
            // Adult
            this._setupNumericalFeedLayout(creatureData);
        }
    }

    if (creatureData.unlocked == "new") {
        this._revealCreatureInfo();
        creatureData.unlocked = true; // so we don't go through the reveal again later
    }

    // Show the next and prev buttons if applicable
    this.currentPage = GLOBAL.creatureManager.creatureList.indexOf(creatureType);
    // remember the current page for when we change pages
    this.prevPageButton.setEnabled(this.currentPage > 0);
    this.nextPageButton.setEnabled(this.currentPage < GLOBAL.creatureManager.creatureList.length - 1);
};

GlassLab.Journal.prototype._setupImageFeedLayout = function(creatureData)
{
    this.dailyDiet.visible = true;
    this.dailyDietTable.visible = false;

    var unusedChildren = this.dailyDiet.children.slice();
    var n = 0;

    // TODO: Use UITable?
    var addDietChild = function(spriteName, scale)
    {
        var child = unusedChildren.pop();
        if (!child)
        {
            child = this.game.make.sprite();
            this.dailyDiet.addChild(child);
            child.anchor.setTo(0.5, 0);
        }
        child.scale.setTo(scale, scale);
        child.visible = true;
        child.x = (n % GlassLab.Journal.FEED_NUM_COLUMNS) * GlassLab.Journal.UNIT_SIZE;
        if (n % GlassLab.Journal.FEED_NUM_COLUMNS > GlassLab.Journal.MAX_ROW_LENGTH) GlassLab.Journal.MAX_ROW_LENGTH = n % GlassLab.Journal.FEED_NUM_COLUMNS;
        child.y = Math.floor(n / GlassLab.Journal.FEED_NUM_COLUMNS) * GlassLab.Journal.UNIT_SIZE;
        n++;
        child.loadTexture(spriteName);
    }.bind(this);

    // Setup creatures
    for (var i = 0, len = creatureData.journalInfo.numCreatures; i < len; i++)
    {
        var spriteName = creatureData.spriteName + "_sticker";
        addDietChild(spriteName, .32);
    }

    // Setup food
    for (var i = 0, len = creatureData.desiredFood.length; i < len; i++) {
        var spriteName = GlassLab.FoodTypes[creatureData.desiredFood[i].type].spriteName + "_sticker";
        for (var j = 0, len2 = creatureData.desiredFood[i].amount * creatureData.journalInfo.numCreatures; j < len2; j++) {
            addDietChild(spriteName, .7);
        }
    }
    for (var k = 0; k < unusedChildren.length; k++) {
        unusedChildren[k].visible = false;
    }

    this.dailyDiet.x = -(GlassLab.Journal.MAX_ROW_LENGTH * GlassLab.Journal.UNIT_SIZE / 2);

};
GlassLab.Journal.prototype._setupNumericalFeedLayout = function(creatureData)
{
    this.dailyDiet.visible = false;
    this.dailyDietTable.visible = true;

    // Restart from scratch
    this.dailyDietTable.clear();

    // Setup creature
    // TODO LABEL
    var creatureNumberLabel = this.game.make.text(0,0, creatureData.journalInfo.numCreatures, {font: "18pt ArchitectsDaughter", fill: "#808080"});
    this.dailyDietTable.addManagedChild(creatureNumberLabel);

    var spriteName = creatureData.spriteName + "_sticker";
    var creatureSticker = this.game.make.sprite(0,0,spriteName);
    creatureSticker.scale.setTo(.32, .32);
    this.dailyDietTable.addManagedChild(creatureSticker);


    // Setup food
    for (var i = 0, len = creatureData.desiredFood.length; i < len; i++) {
        var colonLabel = this.game.make.text(0,0, ":", {font: "18pt ArchitectsDaughter", fill: "#808080"});
        this.dailyDietTable.addManagedChild(colonLabel);

        // TODO LABEL
        var creatureNumberLabel = this.game.make.text(0,0, creatureData.desiredFood[i].amount * creatureData.journalInfo.numCreatures, {font: "18pt ArchitectsDaughter", fill: "#808080"});
        this.dailyDietTable.addManagedChild(creatureNumberLabel);

        spriteName = GlassLab.FoodTypes[creatureData.desiredFood[i].type].spriteName + "_sticker";
        var foodSticker = this.game.make.sprite(0,0,spriteName);
        foodSticker.scale.setTo(.7, .7);
        this.dailyDietTable.addManagedChild(foodSticker);
    }

    this.dailyDietTable._refresh();

    this.dailyDietTable.x = -this.dailyDietTable.getWidth()/2;
};

GlassLab.Journal.prototype._revealCreatureInfo = function() {
    this.creatureArt.alpha = 0;
    this.game.add.tween(this.creatureArt).to( {alpha: 1}, 1000, Phaser.Easing.Linear.InOut, true );
    this.game.add.tween(this.nameLabel).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 1000 );
    //this.game.add.tween(this.temperamentLabel).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 1500 );
    this.game.add.tween(this.dailyDiet).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 1500 );
};

GlassLab.Journal.prototype.hide = function(auto)
{
    GlassLab.UIWindow.prototype.hide.call(this);

    if (auto !== true) GlassLabSDK.saveTelemEvent("close_journal", {});

    GlassLab.SignalManager.journalClosed.dispatch();
};

GlassLab.Journal.prototype._onNextPagePressed = function()
{
    this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage+1]);
};

GlassLab.Journal.prototype._onPrevPagePressed = function()
{
    this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage-1]);
};
