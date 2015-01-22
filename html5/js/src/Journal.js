/**
 * Created by Jerry Fu on 1/21/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.Journal = function(game) {
    this.sprite = game.make.sprite();

    this.background = game.make.graphics();
    this.background.beginFill(0xAAAAFF).drawRect(0, 0, 800, 600);
    this.sprite.addChild(this.background);

    this.closeButton = game.make.button(800, 0, "closeIcon" , this._onClosePressed, this);
    this.closeButton.anchor.setTo(.5, .5);
    this.closeButton.scale.setTo(.1, .1);
    this.sprite.addChild(this.closeButton);

    this.journalLabel = game.make.text(400, 50, "Journal");
    this.journalLabel.anchor.setTo(.5, 0);
    this.sprite.addChild(this.journalLabel);

    // Feed log
    const tableWidth = 200;
    const tableHeight = 200;
    const cellWidth = 98;
    const cellHeight = 50;
    const padding = 4;
    const tableY = 50;
    this.feedLog = game.make.sprite(500, 100);
    var feedLogLines = game.make.graphics(0, tableY);
    feedLogLines.beginFill(0xffffff).drawRect(cellWidth,0,padding,tableHeight).drawRect(0,cellHeight - padding,tableWidth,padding).drawRect(0,cellHeight*2 - padding,tableWidth,padding).drawRect(0,cellHeight*3 - padding,tableWidth,padding);
    this.feedLog.addChild(feedLogLines);
    this.sprite.addChild(this.feedLog);
    this.feedLogEntries = [];
    for (var i=0; i < 4; i++)
    {
        var creatureText = game.make.text(cellWidth/2,cellHeight * i + tableY,"-");
        creatureText.anchor.setTo(.5, 0);
        this.feedLog.addChild(creatureText);
        var foodText = game.make.text(cellWidth/2 + tableWidth/2,cellHeight * i + tableY,"-");
        foodText.anchor.setTo(.5, 0);
        this.feedLog.addChild(foodText);
        this.feedLogEntries.push([creatureText, foodText]);
    }

    var feedLogLabel = game.make.text(100, 0, "Feed Log");
    feedLogLabel.anchor.setTo(.5, 0);
    this.feedLog.addChild(feedLogLabel);

    // Order


    // Creature Picture
    this.creatureView = game.make.sprite(200, 100, "sheep");
    this.creatureView.anchor.setTo(.5, 0);
    this.creatureView.scale.setTo(.5, .5);
    this.creatureLabel = game.make.text(0, 550, "Rammus");
    this.creatureLabel.anchor.setTo(.5, 0);
    this.creatureView.addChild(this.creatureLabel);
    this.sprite.addChild(this.creatureView);

    this.sprite.visible = false;
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
    this.creatureLabel.setText(creatureName.charAt(0).toUpperCase() + creatureName.slice(1));

    for (var i=0, j=creatureData.discoveredFeedCounts.length; i < j && i < 4; i++)
    {
        this.feedLogEntries[i][0].setText(creatureData.discoveredFeedCounts[i]);
        this.feedLogEntries[i][1].setText(creatureData.discoveredFeedCounts[i] * creatureData.desiredAmount);
    }
};

GlassLab.Journal.prototype.Hide = function()
{
    this.sprite.visible = false;
};

GlassLab.Journal.prototype._onClosePressed = function()
{
    this.Hide();
};