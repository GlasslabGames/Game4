/**
 * Created by Rose Abernathy on 1/27/2015.
 */

var GlassLab = GlassLab || {};

/**
 * FillBar
 */
GlassLab.FillBar = function(game, width, height) {
  this.game = game;
  this.sprite = game.add.sprite();
  this.amount = 0;
  this.width = width || 500;
  this.height = height || 100;

  var borderSize = 8;
  var bg = game.add.graphics(0, 0);
  bg.beginFill(0xffffff);
  bg.drawRect(borderSize, borderSize, -this.width - 2*borderSize, -this.height - 2*borderSize);
  this.sprite.addChild(bg);
  bg.x = this.width / 2;

  this.fill = game.add.graphics(0, 0);
  this.fill.x = this.width / 2;
  this.sprite.addChild(this.fill);

  this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);

  this.targetAmount = -1;
  this.dAmount = 0;
};

GlassLab.FillBar.GOOD_COLOR = 0x3bb44a;
GlassLab.FillBar.BAD_COLOR = 0xc0272d;

// Set the fillbar to this amount (clamped to 0-1). If animate is true, it will gradually change
GlassLab.FillBar.prototype.Set = function(amount, animate) {
  this.sprite.visible = true;
  amount = Math.max(amount, 0); // clamp to 0, but keep the amount the same if it's higher since we change the color later

  if (animate) {
    var changeDuration = 100; // default time
    this.targetAmount = amount;
    this.dAmount = (this.targetAmount - this.amount) / changeDuration;
  } else {
    this.amount = amount;
    this._redraw();
  }
};

GlassLab.FillBar.prototype._onUpdate = function() {
  if (this.dAmount != 0 && this.targetAmount >= 0) {
    this.amount += this.dAmount;
    this._redraw();
    if (this.targetAmount - this.amount < this.dAmount) {
      this.amount = this.targetAmount;
      this.dAmount = 0;
      this.targetAmount = -1;
    }
  }
};

GlassLab.FillBar.prototype._redraw = function() {
  this.fill.clear();
  var amount = this.amount;
  if (amount > 1) { // if we go over 100%, clamp it but show a bad color
    amount = 1;
    this.fill.beginFill(GlassLab.FillBar.BAD_COLOR);
  } else {
    this.fill.beginFill(GlassLab.FillBar.GOOD_COLOR);
  }
  this.fill.drawRect(0, 0, -this.width * amount, -this.height);
};