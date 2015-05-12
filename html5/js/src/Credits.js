
var GlassLab = GlassLab || {};

GlassLab.Credits = function(game) {
    GlassLab.UIWindow.prototype.constructor.call(this, game);
    this.sprite = game.make.sprite(0, -50);
    this.addChild(this.sprite);

    this.bg = game.make.sprite(-25,30, "creditsBg");
    this.bg.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.bg);

    this.data = this.game.cache.getJSON("creditText");
    this.pages = []; // list of credit data
    console.log(this.data);

    // Page buttons - like Journal.js
    var pageButtonX = this.bg.width / 2 + 40;
    this.nextPageButton = new GlassLab.HUDButton(this.game, pageButtonX, -30, null, "sideArrow", "Next\nPage", {font: "12pt EnzoBlack"}, true, this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.label.x -= 8;
    this.nextPageButton.addOutline("sideArrowHighlight");
    this.bg.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, -30, null, "sideArrow", "Prev\nPage", {font: "12pt EnzoBlack"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.label.x += 8;
    this.bg.addChild(this.prevPageButton);
    this.prevPageButton.addOutline("sideArrowHighlight");
    this.prevPageButton.outline.scale.x = -1;
    this.prevPageButton.bg.scale.x *= -1;
};

GlassLab.Credits.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.Credits.prototype.constructor = GlassLab.Credits;

GlassLab.Credits.prototype.show = function(auto, creatureType)
{
    GlassLab.UIWindow.prototype.show.call(this);
};

GlassLab.Credits.prototype.hide = function(auto)
{
    GlassLab.UIWindow.prototype.hide.call(this);
};

GlassLab.Credits.prototype._onNextPagePressed = function()
{
    //this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage+1]);
};

GlassLab.Credits.prototype._onPrevPagePressed = function()
{
    //this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage-1]);
};


GlassLab.Credits.prototype._drawSection = function(index)
{
    //this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage-1]);
};