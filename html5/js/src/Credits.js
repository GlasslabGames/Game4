
var GlassLab = GlassLab || {};

GlassLab.Credits = function(game) {
    GlassLab.UIWindow.prototype.constructor.call(this, game);
    this.sprite = game.make.sprite(0, -50);
    this.addChild(this.sprite);

    this.bg = game.make.sprite(-25,30, "creditsBg");
    this.bg.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.bg);

    this.currentPage = 0;
    this.pages = [];

    // Page buttons - like Journal.js
    var pageButtonX = this.bg.width / 2 + 40;
    this.nextPageButton = new GlassLab.HUDButton(this.game, pageButtonX, -30, null, "sideArrow", "Next\nPage", {font: "12pt EnzoBlack"}, true, this._onNextPagePressed, this);
    this.nextPageButton.anchor.setTo(0, 0.5);
    this.nextPageButton.label.x -= 8;
    this.nextPageButton.addOutline("sideArrowHighlight");
    this.bg.addChild(this.nextPageButton);

    this.prevPageButton = new GlassLab.HUDButton(this.game, -pageButtonX, -30, null, "sideArrow", "Prev\nPage", {font: "14pt EnzoBlack"}, true, this._onPrevPagePressed, this);
    this.prevPageButton.anchor.setTo(0, 0.5);
    this.prevPageButton.label.x += 8;
    this.bg.addChild(this.prevPageButton);
    this.prevPageButton.addOutline("sideArrowHighlight");
    this.prevPageButton.outline.scale.x = -1;
    this.prevPageButton.bg.scale.x *= -1;
};

GlassLab.Credits.prototype = Object.create(GlassLab.UIWindow.prototype);
GlassLab.Credits.prototype.constructor = GlassLab.Credits;

GlassLab.Credits.prototype.show = function()
{
    GlassLab.UIWindow.prototype.show.call(this);
    this.currentPage = 0;
    this._refresh();
};

GlassLab.Credits.prototype.hide = function()
{
    GlassLab.UIWindow.prototype.hide.call(this);
};

GlassLab.Credits.prototype._onNextPagePressed = function()
{
    this.currentPage ++;
    this._refresh();
};

GlassLab.Credits.prototype._onPrevPagePressed = function()
{
    this.currentPage --;
    this._refresh();
};

GlassLab.Credits.prototype._refresh = function() {
    if (!this.pages.length) this._generatePages();
    for (var i = 0; i < this.pages.length; i++) {
        this.pages[i].visible = (this.currentPage == i);
    }
    this.prevPageButton.visible = (this.currentPage > 0);
    this.nextPageButton.visible = (this.currentPage < this.pages.length - 1);
};

GlassLab.Credits.prototype._generatePages = function()
{
    var data = this.game.cache.getJSON("creditText");
    var sectionIndex = 0, section = [];
    var page = this.sprite.addChild(this.game.make.sprite(5, -180));
    this.pages.push(page);
    var text, style, margin, label;
    var y = 0;
    for (var i = 0; i < data.length; i++) {
        text = data[i];
        style = {wordWrap: true, wordWrapWidth: 320, align: "center"};
        if (text.indexOf("*h") > -1) { // it has a header marker
            style.fill = "#4d4d4d";
            if (text.indexOf("*h0") > -1) style.font = "16pt ArchitectsDaughter"; // for "Credits" if we include it
            else if (text.indexOf("*h1") > -1) style.font = "12pt ArchitectsDaughter";
            else style.font = "8pt ArchitectsDaughter"; // *h2
            margin = 10;
            text = text.substr(text.indexOf("*h") + 4);
            sectionIndex = i; // the index when we started a section
            section = [];
        } else {
            style.font = "10pt ArchitectsDaughter";
            style.fill = "#808080";
            margin = -5;
        }
        y += margin;
        label = this.game.make.text(0, y, "", style);
        GlassLab.Util.SetCenteredText(label, text, 0.5, 0);
        page.addChild(label);
        section.push(label);
        y += label.height;

        console.log(text, y);
        if (y > 400) { // end of this page, so restart this section on a new page
            y = 0;

            page = this.sprite.addChild(this.game.make.sprite(5, -175));
            this.pages.push(page);

            // remove contents of this section, which are on the wrong page
            for (var j = section.length - 1; j >= 0; j--) {
                section[j].destroy();
            }

            i = sectionIndex-1; // restart from the beginning of the section, adding stuff to this page
        }
    }
};

GlassLab.Credits.prototype._drawSection = function(index)
{
    //this.RefreshWithCreature(GLOBAL.creatureManager.creatureList[this.currentPage-1]);
};