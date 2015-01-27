/**
 * Created by Jerry Fu on 1/26/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UITextInput = function(game)
{
    Phaser.Sprite.prototype.constructor.call(this, game);
    this.game = game;
    this.data = null;
    this.container = this.game.make.group();

    this.inputLimit = 10; // limit on characters in the text box

    this.bg = game.make.graphics();
    this.bg.beginFill(0xAAAAFF).drawRect(0,0,60,36);
    this.addChild(this.bg);

    this.textLabel = game.make.text(5,0,"");
    //this.textLabel.anchor.setTo(0.5, 0);
    this.addChild(this.textLabel);
    this.textLabel.inputEnabled = true;
    this.textLabel.events.onInputDown.add(this._onClick, this);

    this.clickHereLabel = game.make.text(0,0,"?");
    this.clickHereLabel.alpha = .5;
    this.textLabel.addChild(this.clickHereLabel);

    game.input.keyboard.addCallbacks(this, this._onKeyDown, null, null);
};

// Extends Sprite
GlassLab.UITextInput.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UITextInput.prototype.constructor = Phaser.UITextInput;

GlassLab.UITextInput.prototype._onClick = function()
{
    this.SetFocus(true);
};

GlassLab.UITextInput.prototype.SetInputLimit = function(int)
{
    this.inputLimit = int;
};

GlassLab.UITextInput.prototype.SetFocus = function(onOrOff)
{
    if (onOrOff)
    {
        GLOBAL.KeyboardFocusItem = this;

        this.clickHereLabel.visible = false;
    }
    else
    {
        GLOBAL.KeyboardFocusItem = this;

        this.clickHereLabel.visible = this.textLabel.text && this.textLabel.text != "";
    }
};

GlassLab.UITextInput.prototype._onKeyDown = function(e)
{
    if (GLOBAL.KeyboardFocusItem == this)
    {
        if (e.keyCode == 8) // backspace
        {
            this.textLabel.setText(this.textLabel.text.substring(0, this.textLabel.text.length-1));
        }
        else if (this.inputLimit == -1 || this.textLabel.text.length-1 < this.inputLimit) // TODO: Why is textLabel appending empty space at beginning?
        {
            if (e.keyCode >= 65 && e.keyCode <= 90) // A-Z
            {
                var char = e.shiftKey ? String.fromCharCode(e.keyCode) : String.fromCharCode(e.keyCode).toLowerCase();
                this.textLabel.setText(this.textLabel.text + char);
            }
            else if (e.keyCode >= 48 && e.keyCode <= 57) // 0-9 (no !@#$%^&*())
            {
                var char = e.shiftKey ? String.fromCharCode(e.keyCode) : String.fromCharCode(e.keyCode).toLowerCase(); // TODO: Don't need lower/upper case, but need special symbols
                this.textLabel.setText(this.textLabel.text + char);
            }
        }
    }
};

GlassLab.UITextInput.prototype.GetText = function()
{
    return this.textLabel.text;
};