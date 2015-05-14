/**
 * Created by Rose Abernathy on 1/27/2015.
 */

var GlassLab = GlassLab || {};

/**
 * FillBar - a percent bar that might have multiple sub bars. Each segment also has its own color.
 * If a segment exceeds 100%, it will turn red. (Currently the "bad color" isn't customizable.)
 * @param sections: an collection of objects containing information about each section of the bar, with keys,
 *  like carrots: {percent: 0.25, color: 0x0000ff} (= a blue bar that's 25% as long as the max size)
 */
GlassLab.FillBar = function(game, width, height, sections) {
    this.game = game;
    this.sprite = game.add.sprite();
    this.width = width || 500;
    this.height = height || 100;

    sections = sections || {0: {percent: 1, color: GlassLab.FillBar.GOOD_COLOR }};
    this.sections = sections;

    this.sectionOrder = [];
    for (var key in this.sections) {
        this.sections[key].amount = this.sections[key].amount || 0;
        this.sections[key].targetAmount = -1;
        this.sections[key].dAmount = 0;
        this.sectionOrder.push(key);
    }

    // order the sections from largest to smallest
    this.sectionOrder.sort(function(a, b) {
        return sections[b].percent - sections[a].percent;
    });

    // figure out the max width for each section
    var maxPercent = this.sections[this.sectionOrder[0]].percent;
    for (var i = 0; i < this.sectionOrder.length; i++) {
        var section = this.sections[this.sectionOrder[i]];
        section.totalWidth = this.width * (section.percent / maxPercent);
    }

    this._setUp(); // set up the graphics
    this._redraw(); // refresh with the starting amounts

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);
    this.sprite.events.onDestroy.add(this._onDestroy, this);
};

GlassLab.FillBar.GOOD_COLOR = 0x3bb44a;
GlassLab.FillBar.BAD_COLOR = 0xc0272d;

GlassLab.FillBar.prototype._onDestroy = function () {
    if (this.updateHandler) this.updateHandler.detach();
};

// override this to use something except simple graphics
GlassLab.FillBar.prototype._setUp = function () {
    var borderSize = 4;
    var bg = this.game.add.graphics(0, 0);
    bg.beginFill(0xffffff);
    this.sprite.addChild(bg);
    bg.x = -this.width / 2;

    this.fill = this.game.add.graphics(0, 0);
    this.fill.x = -this.width / 2;
    this.sprite.addChild(this.fill);

    for (var i = 0; i < this.sectionOrder.length; i++) {
        var section = this.sections[this.sectionOrder[i]];
        section.yOffset = (this.height + borderSize * 3) * (this.sectionOrder.length - 1 - i);
        bg.drawRect(-borderSize, borderSize - section.yOffset, section.totalWidth + 2*borderSize, -this.height - 2*borderSize);
    }
};

// Set the nth section of the fill bar to this amount (clamped to 0-1). If animate is true, it will gradually change.
// If hideafter is set to a number, it will hide after that much time in seconds
GlassLab.FillBar.prototype.setAmount = function(key, amount, animate, hideAfter) {
    //console.log("key:", key, "amount:", amount, "animate:", animate, "hideAfter:", hideAfter);
    this.hideAfter = hideAfter;
    amount = Math.max(amount, 0); // clamp to 0, but keep the amount the same if it's higher since we change the color later
    var section = this.sections[key];
    if (animate) {
        this.show(true);
        var changeDuration = 50; // default time
        section.targetAmount = amount;
        section.dAmount = (section.targetAmount - section.amount) / changeDuration;
        this.animating = true;
    } else {
        section.amount = amount;
        this._redraw();
    }
};

// turns the whole bar red. Currently unused. The bar should disappear after a bit, maybe.
GlassLab.FillBar.prototype.showError = function() {
    this.show(true);
    for (var key in this.sections) {
        this.setAmount(key, 2, false);
    }
};

GlassLab.FillBar.prototype.show = function(show, hideAfter) {
    if (show && !this.sprite.visible && hideAfter) {
        if (this.timer) this.game.time.events.remove(this.timer); // don't allow multiple hide timers at once
        this.timer = this.game.time.events.add(Phaser.Timer.SECOND * hideAfter, function(){ this.show(false); }, this);
    }

    this.sprite.visible = show;
};

GlassLab.FillBar.prototype.reset = function() {
    for (var key in this.sections) {
        this.sections[key].amount = 0;
        this.sections[key].targetAmount = -1;
        this.sections[key].dAmount = 0;
    }
    this._redraw();
};

GlassLab.FillBar.prototype._onFinishAnim = function() {
    if (this.hideAfter) {
        if (this.timer) this.game.time.events.remove(this.timer); // don't allow multiple hide timers at once
        this.timer = this.game.time.events.add(Phaser.Timer.SECOND * this.hideAfter, function(){ this.show(false); }, this);
    } else if (this.hideAfter === 0) {
        this.show(false);
    }
    // else stay visible
};


GlassLab.FillBar.prototype._onUpdate = function() {
    if (this.animating) {
        this.animating = false; // it will only stay false if all animations are done
        for (var key in this.sections) {
            var section = this.sections[key];
            if (section.dAmount != 0 && section.targetAmount >= 0) {
                section.amount += section.dAmount;
                if (Math.abs(section.targetAmount - section.amount) < Math.abs(section.dAmount)) {
                    section.amount = section.targetAmount;
                    section.dAmount = 0;
                    section.targetAmount = -1;
                } else {
                    this.animating = true;
                }
                this._redraw();
            }
        }
        if (!this.animating) this._onFinishAnim();
    }
    if (this.sprite) this.sprite.scale.x = ((this.sprite.parent.scale.x > 0)? 1 : -1) * Math.abs(this.sprite.scale.x);
};

GlassLab.FillBar.prototype._redraw = function() {
    this.fill.clear();
    for (var i = 0; i < this.sectionOrder.length; i++) {
        var section = this.sections[this.sectionOrder[i]];
        var amount = section.amount;
        if (section.amount > 1) {
            amount = 1;
            this.fill.beginFill(GlassLab.FillBar.BAD_COLOR);
        } else {
            this.fill.beginFill(section.color);
        }
        var width = section.totalWidth * amount;
        this.fill.drawRect(0, - section.yOffset, width, -this.height);
    }
};

// Hunger bar - a fillbar with different graphics
GlassLab.HungerBar = function(game, sections) {
    GlassLab.FillBar.prototype.constructor.call(this, game, 80, 0, sections);
    // _setUp will be called by the parent constructor

    this.sprite.hitArea = new Phaser.Rectangle(); // for some reason the hit area was way too big and getting added to the parent's. So just make it super tiny.
};

GlassLab.HungerBar.prototype = Object.create(GlassLab.FillBar.prototype);
GlassLab.HungerBar.prototype.constructor = GlassLab.HungerBar.prototype;


GlassLab.HungerBar.prototype._setUp = function() {
    this.sprite.anchor.setTo(0.5, 1);

    if (this.sectionOrder.length == 1) {
        var bg = this.game.make.sprite(0, 0, "hungerBarSingleBg");
        this.sprite.addChild(bg);

        var fill = this.game.make.sprite(0, 0, "hungerBarSingleFill");
        this.sprite.addChild(fill);

        this.sections[this.sectionOrder[0]].fill = fill;

    } else if (this.sectionOrder.length == 2) {
        var bg = this.game.make.sprite(0, 0, "hungerBarDoubleBgBase");
        bg.anchor.setTo(0, 0.5);
        this.sprite.addChild(bg);

        for (var i = 0; i < this.sectionOrder.length; i++) {
            var section = this.sections[this.sectionOrder[i]];

            var bgWidth = this.game.make.sprite(bg.x + bg.width, 0, "hungerBarDoubleBgWidth");
            bgWidth.width = section.totalWidth;
            bgWidth.anchor.setTo(0, 0.5);
            if (i % 2 == 0) bgWidth.scale.y = -1;
            this.sprite.addChild(bgWidth);

            var bgCap = this.game.make.sprite(bgWidth.x + bgWidth.width, 0, "hungerBarDoubleBgCap");
            bgCap.anchor.setTo(0, 0.5);
            if (i % 2 == 0) bgCap.scale.y = -1;
            this.sprite.addChild(bgCap);

            var fillBase = this.game.make.sprite(bg.x + bg.width, 0, "hungerBarDoubleFillBase");
            fillBase.anchor.setTo(1, 0.5);
            if (i % 2 == 0) fillBase.scale.y = -1;
            this.sprite.addChild(fillBase);
            section.fillBase = fillBase;

            var fill = this.game.make.sprite(fillBase.x, 0, "hungerBarDoubleFillWidth");
            fill.anchor.setTo(0, 0.5);
            fill.width = section.totalWidth;
            if (i % 2 == 0) fill.scale.y = -1;
            this.sprite.addChild(fill);
            section.fill = fill;
        }
    } else {
        console.error("HungerBars can only have 1 or 2 sections!");
    }
};

GlassLab.HungerBar.prototype._redraw = function() {
    for (var i = 0; i < this.sectionOrder.length; i++) {
        var section = this.sections[this.sectionOrder[i]];
        var amount = section.amount;
        if (section.fillBase) section.fillBase.tint = (section.amount > 1)? GlassLab.FillBar.BAD_COLOR : section.color;
        section.fill.tint = (section.amount > 1)? GlassLab.FillBar.BAD_COLOR : section.color;
        if (section.amount > 1) amount = 1;

        var width = section.totalWidth * amount;
        if (section.fillBase) {
            section.fillBase.visible = (width > 0);
            section.fill.width = width;
        } else {
            if (width > 0) width += 30; // 30 is the size of space on the left side of the fill asset
            section.fill.crop(new Phaser.Rectangle(0, 0, width, section.fill.height));
        }
    }
};