/**
 * Created by Jerry Fu on 1/26/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UITextInput = function(game, inputType)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);
    this.game = game;
    this.data = null;
    this.container = this.game.make.group();

    this.inputType = inputType || GlassLab.UITextInput.InputType.FULL;

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

    this.events.onTextChange = new Phaser.Signal();
};

// Extends Sprite
GlassLab.UITextInput.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UITextInput.prototype.constructor = GlassLab.UITextInput;

GlassLab.UITextInput.prototype._onClick = function()
{
    this.SetFocus(true);
};

GlassLab.UITextInput.prototype.SetText = function(text)
{
    this.textLabel.setText(text);
};

GlassLab.UITextInput.prototype._onGlobalClick = function(pointer, DOMevent)
{
    if (!pointer.targetObject || pointer.targetObject.sprite != this) // if something other than this was clicked on
    {
        this.SetFocus(false);
    }
};

GlassLab.UITextInput.prototype._blinkCursor = function(positionOnly) {
    this.textCursor.visible = !this.textCursor.visible;
    if (this.textCursor.visible) this._updateCursor();
};

GlassLab.UITextInput.prototype._updateCursor = function()
{
    var localBounds = this.textLabel.getLocalBounds();
    this.textCursor.x = localBounds.width+20; // TODO: HACK
    this.textCursor.y = localBounds.height;
};

GlassLab.UITextInput.prototype.SetInputLimit = function(int)
{
    this.inputLimit = int;
};

GlassLab.UITextInput.prototype._onFocusChanged = function()
{
    if (this.hasFocus) {
        this.clickHereLabel.visible = false;
        this.textCursorUpdateTimer = this.game.time.events.loop(500, this._blinkCursor, this);
        this.game.input.onDown.add(this._onGlobalClick, this); // Global input down handler
        this.game.input.keyboard.addCallbacks(this, this._onKeyDown); // note, there can only be one onDownCallback at a time
    } else {
        this.game.input.onDown.remove(this._onGlobalClick, this); // Global input down handler
        if (this.game.input.keyboard.onDownCallback == this._onKeyDown) this.game.input.keyboard.onDownCallback = null;
        this.game.time.events.remove(this.textCursorUpdateTimer);
        this.textCursor.visible = false;
        this.clickHereLabel.visible = !(this.textLabel.text && this.textLabel.text != "" && this.textLabel.text != " ");
    }
};

GlassLab.UITextInput.prototype._onKeyDown = function(e)
{
    if (this.hasFocus)
    {
        if (e.keyCode == 8) // backspace
        {
            this.textLabel.setText(this.textLabel.text.substring(0, this.textLabel.text.length-1));
            this.events.onTextChange.dispatch(this.GetText());
        }
        else if (this.inputLimit == -1 || this.textLabel.text.length < this.inputLimit) // TODO: Why is textLabel appending empty space at beginning?
        {
            if (e.keyCode >= 65 && e.keyCode <= 90) // A-Z
            {
                if (this.inputType == GlassLab.UITextInput.InputType.ALPHANUMERIC || this.inputType == GlassLab.UITextInput.InputType.FULL)
                {
                    this._addCharFromKeyboardEvent(e);
                }
            }
            else if (e.keyCode >= 48 && e.keyCode <= 57) // 0-9 (no !@#$%^&*())
            {
                this._addCharFromKeyboardEvent(e);
            }
            else if (e.keyCode >= 96 && e.keyCode <= 105) // 0-9 (keypad)
            {
                e.keyCode -= 48;
                this._addCharFromKeyboardEvent(e);
            }
        }
        this._updateCursor(); // immediately update the cursor position
    }
};

GlassLab.UITextInput.prototype._addCharFromKeyboardEvent = function(e)
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

    this.events.onTextChange.dispatch(this.GetText());
};

GlassLab.UITextInput.prototype.GetText = function()
{
    return this.textLabel.text;
};

GlassLab.UITextInput.InputType = {
    ALPHANUMERIC: "alphanumeric",
    NUMERIC: "numeric",
    FULL: "full"
};