/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();
    this.sprite.scale.setTo(0.8, 0.8);
/*
    this.background = game.make.graphics();
    this.background.beginFill(0xAAAAFF).drawRect(0, 0, 800, 600);
    this.sprite.addChild(this.background);
*/
    // PLACEHOLDER
    this.bg = game.make.sprite(0,0, "journalBg");
    this.sprite.addChild(this.bg);

    this.alerts = game.make.sprite();
    this.sprite.addChild(this.alerts);
/*
    this.journalLabel = game.make.text(400, 50, "Journal");
    this.journalLabel.anchor.setTo(.5, 0);
    this.sprite.addChild(this.journalLabel);
*/
    // Feed log - note I'm not going to use a UITable here because the UI table adjusts to contents, which we don't need
    this.feedLog = game.make.sprite(645, 200);
    this.sprite.addChild(this.feedLog);
    var rowHeight = 60;
    var colWidth = 210;
    this.foodLogEntries = [];
    for (var i = 0; i < 8; i++) {
      var y = i * rowHeight;
      var creatureText = game.make.text(0, rowHeight * i,"creature"+i);
      creatureText.anchor.setTo(0.5, 0.5);
      this.feedLog.addChild(creatureText);

      var foodText = game.make.text(colWidth, rowHeight * i, "food"+i);
      foodText.anchor.setTo(0.5, 0.5);
      this.feedLog.addChild(foodText);

      this.foodLogEntries.push({creatureText: creatureText, foodText: foodText});
    }
/*
    var feedLogLabel = game.make.text(100, -50, "Feed Log");
    feedLogLabel.anchor.setTo(.5, 0);
    this.feedLog.addChild(feedLogLabel);

    // Creature Picture
    this.creatureView = game.make.sprite(200, 100, "sheep");
    this.creatureView.anchor.setTo(.5, 0);
    this.creatureView.scale.setTo(.5, .5);
    this.creatureLabel = game.make.text(0, 550, "Rammus");
    this.creatureLabel.anchor.setTo(.5, 0);
    this.creatureView.addChild(this.creatureLabel);
    this.sprite.addChild(this.creatureView);
*/
    this.closeButton = game.make.button(1000, 0, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(.5, .5);
    this.closeButton.scale.setTo(.25, .25);
    this.sprite.addChild(this.closeButton);

    this.sprite.visible = false;
    //this.Show();
};

GlassLab.Journal.prototype.IsShowing = function()
{
    return this.sprite.visible;
};

GlassLab.Journal.prototype.Show = function()
{
    this.sprite.visible = true;

    this.RefreshWithCreature("rammus");
};

GlassLab.Journal.prototype.RefreshWithCreature = function(creatureType)
{
  var creatureData = GLOBAL.creatureManager.GetCreatureData(creatureType);

  var creatureName = creatureType.toString();
  //this.creatureLabel.setText(creatureName.charAt(0).toUpperCase() + creatureName.slice(1));

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
};

GlassLab.Journal.prototype.Hide = function()
{
  this.sprite.visible = false;
  this._clearAlerts(); // only show the alerts for one time the journal is up
  GLOBAL.creatureManager.UnflagDiscoveredFoodCounts();

  GlassLab.SignalManager.journalClosed.dispatch();
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