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
    this.inputEnabled = true;
    this.events.onInputDown.add(this._onClick, this);

    this.bg = game.make.graphics();
    this.bg.beginFill(0xAAAAFF).lineStyle(3, 0x000000, 1).drawRect(0,0,60,36);
    this.addChild(this.bg);

    this.textLabel = game.make.text(30,this.getLocalBounds().height/2,"");
    this.textLabel.anchor.setTo(0.5, 0.5);
    this.addChild(this.textLabel);

    this.textCursor = game.make.text(0,0,"|");
    this.textCursor.visible = false;
    this.textCursor.anchor.setTo(0, 1);
    this.textCursorUpdateTimer = null;
    this.addChild(this.textCursor);

    this.clickHereLabel = game.make.text(0,0,"?");
    this.clickHereLabel.anchor.setTo(.5, .5);
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

GlassLab.UITextInput.prototype._updateCursor = function()
{
    if (!this.textCursor.visible)
    {
        var localBounds = this.textLabel.getLocalBounds();
        this.textCursor.x = localBounds.width+20; // TODO: HACK
        this.textCursor.y = localBounds.height;
    }

    this.textCursor.visible = !this.textCursor.visible;
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

        this.textCursorUpdateTimer = this.game.time.events.repeat(500, -1, this._updateCursor, this);
        this.textCursorUpdateTimer.loop = true;
        this.game.time.events.start();
    }
    else
    {
        GLOBAL.KeyboardFocusItem = this;

        this.game.time.events.remove(this.textCursorUpdateTimer);

        this.textCursor.visible = false;

        this.clickHereLabel.visible = !(this.textLabel.text && this.textLabel.text != "" && this.textLabel.text != " ");
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
        else if (this.inputLimit == -1 || this.textLabel.text.length < this.inputLimit) // TODO: Why is textLabel appending empty space at beginning?
        {
            if (e.keyCode >= 65 && e.keyCode <= 90) // A-Z
            {
                var char = e.shiftKey ? String.fromCharCode(e.keyCode) : String.fromCharCode(e.keyCode).toLowerCase();
                if (this.textLabel.text == ' ')
                {
                    this.textLabel.setText(char);
                }
                else
                {
                    this.textLabel.setText(this.textLabel.text + char);
                }
            }
            else if (e.keyCode >= 48 && e.keyCode <= 57) // 0-9 (no !@#$%^&*())
            {
                var char = e.shiftKey ? String.fromCharCode(e.keyCode) : String.fromCharCode(e.keyCode).toLowerCase(); // TODO: Don't need lower/upper case, but need special symbols
                if (this.textLabel.text == ' ')
                {
                    this.textLabel.setText(char);
                }
                else
                {
                    this.textLabel.setText(this.textLabel.text + char);
                }
            }
        }
    }
};

GlassLab.UITextInput.prototype.GetText = function()
{
    return this.textLabel.text.substring(1); // TODO: Why does textlabel append a space at the front? D:
};