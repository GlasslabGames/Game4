/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();
    this.sprite.scale.setTo(0.7, 0.7);
    /*
     // Commenting this out since we're using the placeholder journal background for now, but maybe add it in the future
     this.background = game.make.graphics();
     this.background.beginFill(0xAAAAFF).drawRect(0, 0, 800, 600);
     this.sprite.addChild(this.background);
     this.journalLabel = game.make.text(400, 50, "Journal");
     this.journalLabel.anchor.setTo(.5, 0);
     this.sprite.addChild(this.journalLabel);
     */
    this.bg = game.make.sprite(0,0, "journalBg");
    this.sprite.addChild(this.bg);

    this.alerts = game.make.sprite();
    this.sprite.addChild(this.alerts);

    // Food Log
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

    // Creature Picture
    this.creatureArt = game.make.sprite(240, 430);
    this.creatureArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureArt);

    // Creature info
    this.creatureInfo = game.make.text(30, 480);
    this.creatureInfo.anchor.setTo(0, 0);
    this.sprite.addChild(this.creatureInfo);

    var dietLabel = game.make.text(300, 500, "Daily Diet:");
    dietLabel.anchor.setTo(0, 0);
    this.sprite.addChild(dietLabel);

    this.dailyDiet = game.make.sprite(310, 530);
    this.sprite.addChild(this.dailyDiet);

    this.unknownDietLabel = game.make.text(300, 530, "???");
    this.unknownDietLabel.anchor.setTo(0, 0);
    this.sprite.addChild(this.unknownDietLabel);

    this.closeButton = game.make.button(970, 30, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(0.5, 0.5);
    this.closeButton.scale.setTo(.2, .2);
    this.sprite.addChild(this.closeButton);

    // Page buttons
    this.nextPageButton = game.make.button(1010, 450, "sideArrow" , this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = game.make.button(-10, 450, "sideArrow" , this._onPrevPagePressed, this);
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

    GlassLab.SignalManager.journalOpened.dispatch(auto, creatureType);
};

GlassLab.Journal.prototype.RefreshWithCreature = function(creatureType)
{
    var creatureData = GLOBAL.creatureManager.GetCreatureData(creatureType);

    this.creatureInfo.setText("Species:\n" + creatureData.journalInfo.name + "\n\nTemperament:\n"+creatureData.journalInfo.temperament);

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

    this.creatureArt.loadTexture(creatureData.spriteName+"_art");
    this.creatureArt.tint = creatureData.spriteTint || 0xffffff; // temporary way to distinguish creatures

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

    // Fill in the Daily Diet if we know it
    var knownDailyDiet = creatureData.discoveredFoodCounts[1];
    this.dailyDiet.visible = knownDailyDiet;
    this.unknownDietLabel.visible = !knownDailyDiet;
    var numCols = 3; // how many foods to display in a single row
    if (knownDailyDiet) {
        var unusedChildren = this.dailyDiet.children.slice();
        var n = 0;
        for (var i = 0, len = creatureData.desiredFood.length; i < len; i++) {
            var spriteName = GlassLab.FoodTypes[creatureData.desiredFood[i].type].spriteName;
            for (var j = 0, len2 = creatureData.desiredFood[i].amount; j < len2; j++) {
                var child = unusedChildren.pop();
                if (!child) {
                    child = this.game.make.sprite();
                    child.anchor.setTo(0.5, 0);
                    child.scale.setTo(0.25, 0.25);
                    this.dailyDiet.addChild(child);
                }
                child.visible = true;
                child.x = (n % numCols) * 50;
                child.y = Math.floor(n / numCols) * 50;
                n++;
                child.loadTexture(spriteName);
            }
        }
        for (var k = 0; k < unusedChildren.length; k++) {
            unusedChildren[k].visible = false;
        }
    }

    // Show the next and prev buttons if applicable
    this.currentPage = GLOBAL.creatureManager.creatureList.indexOf(creatureType);
    // remember the current page for when we change pages
    this.prevPageButton.visible = this.currentPage > 0;
    this.nextPageButton.visible = this.currentPage < GLOBAL.creatureManager.creatureList.length - 1;
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