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
    GlassLab.UIElement.prototype.constructor.call(this, game);

    this.borderPadding = 20;
    this.innerPadding = 20;

    this.root = this.game.make.sprite(); // allows us to offset all the other components
    this.addChild(this.root);

    buttons = [].concat(buttons); // if buttons isn't an array, put it in one

    this.table = new GlassLab.UITable(this.game, buttons.length, this.innerPadding);
    for (var i = 0, len = buttons.length; i < len; i++) {
        this.table.addManagedChild(buttons[i], i == len-1); // refresh on the last one
    }

    this.label = game.make.text(0, this.borderPadding, text, {font: "20px EnzoBlack"});
    this.label.anchor.setTo(.5, 0);

    this.bg = game.make.graphics();

    this.root.addChild(this.bg);
    this.root.addChild(this.label);
    this.root.addChild(this.table);

    this.maxLabelWidth = 400; // only relevant when wrapText is on

    this.resize();

    this.visible = false;
};

// Extends Sprite
GlassLab.UIModal.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIModal.prototype.constructor = Phaser.UIModal;

GlassLab.UIModal.prototype.Show = function() {
    GLOBAL.audioManager.playSound("popUpSound");
    this.visible = true;
};

GlassLab.UIModal.prototype.Hide = function() {
    this.visible = false;
};

GlassLab.UIModal.prototype.setText = function(text, wrap) {
    if (wrap) {
        GlassLab.UIManager.wrapText(this.label, text, this.maxLabelWidth);
    } else {
        this.label.text = text;
    }

    this.resize();
};

GlassLab.UIModal.prototype.resize = function() {
    var width = Math.max( this.table.getWidth(), this.label.width) + this.borderPadding * 2;
    var height = this.table.getHeight() + this.borderPadding * 2 + ((this.label.height > 0)? this.label.height + this.innerPadding : 0);

    this.label.x = width / 2;
    this.table.x = 0.5 * (width - this.table.getWidth()); // center the table

    if (this.label.height > 0) this.table.y = this.borderPadding + this.label.height + this.innerPadding;

    this.bg.clear();
    this.bg.beginFill(0xffffff).lineStyle(3, 0x000000).drawRect(0,0,width,height);

    this.root.x = -0.5 * width;
    this.root.y = -0.5 * height;

    this.actualHeight = height;
    this.actualWidth = width;
};
