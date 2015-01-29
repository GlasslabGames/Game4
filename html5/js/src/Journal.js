/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();
    this.sprite.scale.setTo(0.8, 0.8);
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

    // Food log - note I'm not going to use a UITable here because the UI table adjusts to contents, which we don't need
    this.foodLog = game.make.sprite(645, 200);
    this.sprite.addChild(this.foodLog);
    var rowHeight = 60;
    var colWidth = 210;
    this.foodLogEntries = [];
    for (var i = 0; i < 8; i++) {
      var y = i * rowHeight;
      var creatureText = game.make.text(0, rowHeight * i);
      creatureText.anchor.setTo(0.5, 0.5);
      this.foodLog.addChild(creatureText);

      var foodText = game.make.text(colWidth, rowHeight * i);
      foodText.anchor.setTo(0.5, 0.5);
      this.foodLog.addChild(foodText);

      this.foodLogEntries.push({creatureText: creatureText, foodText: foodText});
    }

    // Feeding Log picture
    this.foodLogCreatureArt = game.make.sprite(0, -40);
    this.foodLogCreatureArt.tint = 0x000000;
    this.foodLogCreatureArt.scale.setTo(0.2, 0.2);
    this.foodLogCreatureArt.anchor.setTo(.5, 1);
    this.foodLog.addChild(this.foodLogCreatureArt);

    this.foodLogFoodArt = game.make.sprite(colWidth, 10);
    this.foodLogFoodArt.scale.setTo(0.55, 0.55);
    this.foodLogFoodArt.anchor.setTo(.5, 1);
    this.foodLog.addChild(this.foodLogFoodArt);

    // Creature Picture
    this.creatureArt = game.make.sprite(240, 460);
    this.creatureArt.anchor.setTo(.5, 1);
    this.sprite.addChild(this.creatureArt);

    // Creature info
    this.creatureInfo = game.make.text(30, 500);
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
    this.nextPageButton = game.make.button(1010, 350, "sideArrow" , this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.nextPageButton);

    this.prevPageButton = game.make.button(-10, 350, "sideArrow" , this._onPrevPagePressed, this);
    this.prevPageButton.scale.x *= -1;
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.sprite.addChild(this.prevPageButton);

    this.sprite.visible = false;
};

GlassLab.Journal.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.Journal.prototype.Show = function(creatureType)
{
    this.sprite.visible = true;

    if (!creatureType) creatureType = GLOBAL.creatureManager.creatureList[this.currentPage || 0];
    // default to the page we last had open, or 0 if we haven't opened the journal yet
    this.RefreshWithCreature(creatureType);
};

GlassLab.Journal.prototype.RefreshWithCreature = function(creatureType)
{
  var creatureData = GLOBAL.creatureManager.GetCreatureData(creatureType);
  this.foodLogCreatureArt.loadTexture(creatureData.spriteName+"_art");
  this.foodLogFoodArt.loadTexture(creatureData.desiredFoodType);
  this.creatureArt.loadTexture(creatureData.spriteName+"_art");

  this.creatureInfo.setText("Species:\n" + creatureData.journalInfo.name + "\n\nTemperament:\n"+creatureData.journalInfo.temperament);

  // Fill in every entry with either the number or ???. We may have to revise for different table behavior later.
  for (var i=0, len=this.foodLogEntries.length; i < len; i++)
  {
    var numCreatures = i + 1; // since row 0 should be for 1 creature
    if (creatureData.discoveredFoodCounts[numCreatures]) {
      this.foodLogEntries[i].creatureText.setText(numCreatures);
      this.foodLogEntries[i].foodText.setText(numCreatures * creatureData.desiredAmount);

      if (creatureData.discoveredFoodCounts[numCreatures] == "new") {
        var alertY = this.foodLogEntries[i].foodText.y + this.foodLogEntries[i].foodText.parent.y;
        this._addAlert(925, alertY);
      }
    } else {
      this.foodLogEntries[i].creatureText.setText("???");
      this.foodLogEntries[i].foodText.setText("???");
    }
  }

  // Fill in the Daily Diet if we know it
  var knownDailyDiet = creatureData.discoveredFoodCounts[1];
  this.dailyDiet.visible = knownDailyDiet;
  this.unknownDietLabel.visible = !knownDailyDiet;
  var numCols = 3; // how many foods to display in a single row
  if (knownDailyDiet) {
    for (var i = 0, j = Math.max(this.dailyDiet.children.length, creatureData.desiredAmount); i < j; i++) {
      if (i < creatureData.desiredAmount) {
        var child; // try to get a child if it exists; else make a new one
        if (i < this.dailyDiet.children.length) {
          child = this.dailyDiet.getChildAt(i);
          child.visible = true;
        } else {
          child = this.game.make.sprite();
          child.anchor.setTo(0.5, 0);
          child.scale.setTo(0.4, 0.4);
          this.dailyDiet.addChild(child);
        }
        child.x = (i % numCols) * 50;
        child.y = Math.floor(i / numCols) * 50;
        child.loadTexture(creatureData.desiredFoodType);
      } else { // more children than we want to display, so hide it
        this.dailyDiet.getChildAt(i).visible = false;
      }
    }
  }

  // Show the next and prev buttons if applicable
  this.currentPage = GLOBAL.creatureManager.creatureList.indexOf(creatureType);
  // remember the current page for when we change pages
  this.prevPageButton.visible = this.currentPage > 0;
  this.nextPageButton.visible = this.currentPage < GLOBAL.creatureManager.creatureList.length - 1;
};

GlassLab.Journal.prototype.Hide = function()
{
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