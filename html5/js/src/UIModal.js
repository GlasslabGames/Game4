/**
 * Created by Rose Abernathy on 1/29/2015.
 */
var GlassLab = GlassLab || {};

/**
 * UIModal - a basic popup that lays out text and buttons. Update with a nice BG, etc, when we get it.
 */
// @param buttons Can be a single button or an array of them
GlassLab.UIModal = function(game, text, buttons)
{
  Phaser.Sprite.prototype.constructor.call(this, game);

  var borderPadding = 20;
  var innerPadding = 20;

  buttons = [].concat(buttons); // if buttons isn't an array, put it in one

  var table = new GlassLab.UITable(this.game, buttons.length, innerPadding);
  for (var i = 0, len = buttons.length; i < len; i++) {
    table.addManagedChild(buttons[i], i == len-1); // refresh on the last one
  }

  var label = game.make.text(0, borderPadding, text);
  label.anchor.setTo(.5, 0);

  var width = Math.max( table.getWidth(), label.width) + borderPadding * 2;
  var height = table.getHeight() + borderPadding * 2 + ((label.height > 0)? label.height + innerPadding : 0);

  label.x = width / 2;
  table.x = 0.5 * (width - table.getWidth()); // center the table

  if (label.height > 0) table.y = borderPadding + label.height + innerPadding;

  var bg = game.make.graphics();
  bg.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(0,0,width,height);

  this.addChild(bg);
  this.addChild(label);
  this.addChild(table);

  this.x = -0.5 * width;
  this.y = -0.5 * height;
  console.log(game.camera.width, width, this.x);
};

// Extends Sprite
GlassLab.UIModal.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UIModal.prototype.constructor = Phaser.UIModal;