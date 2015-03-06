/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    this.game = game;
    this.sprite = game.make.sprite(0, -80);

    this.bg = game.make.sprite(-10,0, "journalBg");
    this.bg.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.bg);

    /*
    // Food Log - this is no longer in the journal, but we'll want to reference it if we add the food log elsewhere
    this.foodLogEntries = [];
    this.foodLogGrid = new GlassLab.UIGrid(this.game, 2, 210, 60, true);
    this.foodLogGrid.x = 555;
    this.foodLogGrid.y = 180;
    this.sprite.addChild(this.foodLogGrid);

    // Feeding Log picture
    this.foodLogCreatureArt = game.make.sprite(0, 160);
    this.foodLogCreatureArt.tint = 0x000000;
    this.foodLogCreatureArt.scale.setTo(0.4, 0.4);
    this.foodLogCreatureArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.foodLogCreatureArt);

    this.foodLogFoodAArt = game.make.sprite(0, 160);
    this.foodLogFoodAArt.scale.setTo(0.4, 0.4);
    this.foodLogFoodAArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.foodLogFoodAArt);

    this.foodLogFoodBArt = game.make.sprite(0, 160);
    this.foodLogFoodBArt.scale.setTo(0.4, 0.4);
    this.foodLogFoodBArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.foodLogFoodBArt);
    */
    this.alerts = game.make.sprite();
    this.sprite.addChild(this.alerts);

    // Creature Picture
    this.creatureSilhouette = game.make.sprite(0, 30);
    this.creatureSilhouette.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureSilhouette);

    this.creatureArt = game.make.sprite(0, 30);
    this.creatureArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureArt);

    // Creature info
    this.nameLabel = game.make.text(0, 50, "Species Unknown", {font: "bold 14pt Arial"});
    this.nameLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.nameLabel);

    var temperamentTitleLabel = game.make.text(-90, 100, "Temperament:", {font: "bold 14pt Arial"});
    temperamentTitleLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(temperamentTitleLabel);

    this.temperamentLabel = game.make.text(-90, 130, "Combative", {font: "bold 14pt Arial"});
    this.temperamentLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.temperamentLabel);

    var dietTitleLabel = game.make.text(90, 100, "Daily Diet:", {font: "bold 14pt Arial"});
    dietTitleLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(dietTitleLabel);

    this.dailyDiet = game.make.sprite(50, 130);
    this.sprite.addChild(this.dailyDiet);

    this.unknownDietLabel = game.make.text(90, 130, "Unknown", {font: "bold 14pt Arial"});
    this.unknownDietLabel.anchor.setTo(0.5, 0);
    this.sprite.addChild(this.unknownDietLabel);

    this.closeButton = game.make.button(145, -175, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(0.5, 0.5);
    this.closeButton.scale.setTo(.15, .15);
    this.sprite.addChild(this.closeButton);

    // Page buttons
    this.nextPageButton = game.make.button(190, 0, "sideArrow" , this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = game.make.button(-210, 0, "sideArrow" , this._onPrevPagePressed, this);
    this.prevPageButton.scale.x *= -1;
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.prevPageButton);

    GlassLab.SignalManager.levelLoaded.add(this._onLevelLoaded, this);

    this.sprite.visible = false;
};

GlassLab.Journal.prototype._onLevelLoaded = function(level)
{
    this.Hide(true);
};

GlassLab.Journal.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.Journal.prototype.Open = function() {
    this.sprite.visible = true;

    if (!creatureType) creatureType = GLOBAL.creatureManager.creatureList[this.currentPage || 0];
    // default to the page we last had open, or 0 if we haven't opened the journal yet
    this.RefreshWithCreature(creatureType);
};

GlassLab.Journal.prototype.Show = function(auto, creatureType)
{
    GlassLabSDK.saveTelemEvent((auto? "journal_shown" : "open_journal"), {});

    this.sprite.visible = true;
    GLOBAL.inventoryMenu.Hide(true);

    if (!creatureType) creatureType = GLOBAL.creatureManager.creatureList[this.currentPage || 0];
    // default to the page we last had open, or 0 if we haven't opened the journal yet
    this.RefreshWithCreature(creatureType);

    this.wantToShow = false; // only show it once per "wantToShow"

    GlassLab.SignalManager.journalOpened.dispatch(auto, creatureType);
};

GlassLab.Journal.prototype.RefreshWithCreature = function(creatureType)
{
    var creatureData = GLOBAL.creatureManager.GetCreatureData(creatureType);
    console.log(creatureType, creatureData);

    this.nameLabel.setText(creatureData.unlocked? creatureData.journalInfo.name : "Species Unknown");
    this.temperamentLabel.setText(creatureData.unlocked? creatureData.journalInfo.temperament : "Unknown");

    if (creatureData.unlocked) {
        this.creatureArt.loadTexture(creatureData.spriteName+"_art");
        this.creatureArt.tint = creatureData.spriteTint || 0xffffff;
    }
    if (!creatureData.unlocked || creatureData.unlocked == "new") {
        this.creatureSilhouette.loadTexture(creatureData.spriteName+"_art_white");
        this.creatureSilhouette.tint = 0x000000;
    }
    this.creatureArt.visible = creatureData.unlocked;
    this.creatureSilhouette.visible = (!creatureData.unlocked || creatureData.unlocked == "new");


    /* Food log - removed from journal
    var numFoodTypes = creatureData.desiredFood.length;
    this.foodLogGrid.colWidth = 420 / (numFoodTypes + 1);
    this.foodLogGrid.numCols = numFoodTypes + 1;

    this.foodLogCreatureArt.loadTexture(creatureData.spriteName+"_art");
    this.foodLogCreatureArt.x = this.foodLogGrid.x + this.foodLogGrid.colWidth * 0.5;
    this.foodLogFoodAArt.loadTexture(GlassLab.FoodTypes[creatureData.desiredFood[0].type].spriteName);
    this.foodLogFoodAArt.x = this.foodLogGrid.x + this.foodLogGrid.colWidth * 1.5;
    if (numFoodTypes > 1) {
        this.foodLogFoodBArt.visible = true;
        this.foodLogFoodBArt.loadTexture(GlassLab.FoodTypes[creatureData.desiredFood[1].type].spriteName);
        this.foodLogFoodBArt.x = this.foodLogGrid.x + this.foodLogGrid.colWidth * 2.5;
    } else {
        this.foodLogFoodBArt.visible = false;
    }


    var unusedEntries = this.foodLogEntries.slice();
    this.foodLogGrid.removeManagedChildren();
    for (var i = 0; i < 8; i++) { // to do: should be looping over discovered food counts, maybe? like if we go above 8??
        var numCreatures = i + 1; // since row 0 should be for 1 creature
        for (var j = 0; j < numFoodTypes + 1; j++) {
            var text = unusedEntries.pop();
            if (!text) {
                text = this.game.make.text();
                text.anchor.setTo(0.5, 0.5);
                this.foodLogEntries.push(text);
            }
            text.visible = true;
            this.foodLogGrid.insertManagedChild(text, j, i);
            if (creatureData.discoveredFoodCounts[numCreatures]) {
                if (j == 0) text.text = numCreatures;
                else text.text = Math.round(numCreatures * creatureData.desiredFood[j - 1].amount * 10) / 10;
            } else text.text = "???";
        }

        if (creatureData.discoveredFoodCounts[numCreatures] == "new") {
            var alertY = this.foodLogGrid.y + this.foodLogGrid.rowHeight * (i + 0.5);
            this._addAlert(800, alertY); // FIXME: the alert isn't showing up...
        }
    }
    this.foodLogGrid.refresh();
    for (var k = 0; k < unusedEntries.length; k++) {
        unusedEntries[k].visible = false;
    }
    */

    // Fill in the Daily Diet if we know it
    this.dailyDiet.visible = creatureData.unlocked;
    this.unknownDietLabel.visible = !creatureData.unlocked;
    var numCols = 5; // how many foods to display in a single row
    var unitSize = 30;
    var maxRowLength = 0;
    if (creatureData.unlocked) {
        var unusedChildren = this.dailyDiet.children.slice();
        var n = 0;
        for (var i = 0, len = creatureData.desiredFood.length; i < len; i++) {
            var spriteName = GlassLab.FoodTypes[creatureData.desiredFood[i].type].spriteName;
            for (var j = 0, len2 = creatureData.desiredFood[i].amount; j < len2; j++) {
                var child = unusedChildren.pop();
                if (!child) {
                    child = this.game.make.sprite();
                    child.anchor.setTo(0.5, 0);
                    child.scale.setTo(0.15, 0.15);
                    this.dailyDiet.addChild(child);
                }
                child.visible = true;
                child.x = (n % numCols) * unitSize;
                if (n % numCols > maxRowLength) maxRowLength = n % numCols;
                child.y = Math.floor(n / numCols) * unitSize;
                n++;
                child.loadTexture(spriteName);
            }
        }
        for (var k = 0; k < unusedChildren.length; k++) {
            unusedChildren[k].visible = false;
        }
        this.dailyDiet.x = 80 - (maxRowLength * unitSize / 2)
    }

    if (creatureData.unlocked == "new") {
        this._revealCreatureInfo();
        creatureData.unlocked = true; // so we don't go through the reveal again later
    }

    // Show the next and prev buttons if applicable
    this.currentPage = GLOBAL.creatureManager.creatureList.indexOf(creatureType);
    // remember the current page for when we change pages
    this.prevPageButton.visible = this.currentPage > 0;
    this.nextPageButton.visible = this.currentPage < GLOBAL.creatureManager.creatureList.length - 1;
};


GlassLab.Journal.prototype._revealCreatureInfo = function() {
    this.game.add.tween(this.creatureArt).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true );
    this.game.add.tween(this.nameLabel).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 1000 );
    this.game.add.tween(this.temperamentLabel).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 1500 );
    this.game.add.tween(this.dailyDiet).from( {alpha: 0}, 1000, Phaser.Easing.Linear.InOut, true, 2000 );
};

GlassLab.Journal.prototype.Hide = function(auto)
{
    if (auto !== true) GlassLabSDK.saveTelemEvent("close_journal", {});

    this.sprite.visible = false;
    this._onLeavePage();
    GlassLab.SignalManager.journalClosed.dispatch();
};

GlassLab.Journal.prototype._onLeavePage = function() {
    this._clearAlerts(); // only show the alerts for one time the journal is up
    GLOBAL.creatureManager.UnflagDiscoveredFoodCounts();
};

GlassLab.Journal.prototype._addAlert = function(x, y) {
    var alert = this.game.make.sprite(x, y, "alertIcon");
    alert.anchor.set(0.5, 0.5);
    alert.scale.set(0.75, 0.75);
    this.alerts.addChild(alert);
};

GlassLab.Journal.prototype._clearAlerts = function(x, y) {
    while (this.alerts.children.length) {
        this.alerts.getChildAt(0).destroy();
    }
};

GlassLab.Journal.prototype._onClosePressed = function()
{
    this.Hide();
};

GlassLab.Journal.prototype._onNextPagePressed = function()
{
    this._onLeavePage();
    this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage+1]);
};

GlassLab.Journal.prototype._onPrevPagePressed = function()
{
    this._onLeavePage();
    this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage-1]);
};