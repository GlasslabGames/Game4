/**
 * Created by Jerry Fu on 1/26/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.UITextInput = function(game, inputType, spriteName, font, yOffset)
{
    GlassLab.UIElement.prototype.constructor.call(this, game, 0, 0, spriteName);
    this.game = game;
    this.data = null;
    //this.container = this.game.make.group();

    this.inputType = inputType || GlassLab.UITextInput.InputType.FULL;

    this.inputLimit = 10; // limit on characters in the text box
    this.inputEnabled = true;
    this.events.onInputDown.add(this._onClick, this);

    if (!spriteName) {
        this.color = 0xCCCCFF;
        this.bg = game.make.graphics();
        this.bg.beginFill(this.color).lineStyle(3, 0x000000, 1).drawRect(0,0,60,36);
        this.addChild(this.bg);
    }

    this.textLabel = game.make.text(30,this.getLocalBounds().height/2,"", font);
    this.textLabel.anchor.setTo(0.5, 0.5);
    if (yOffset) this.textLabel.y += yOffset; // this handles fonts that are weirdly offset
    this.addChild(this.textLabel);

    this.textCursor = game.make.text(0,0,"|");
    this.textCursor.visible = false;
    this.textCursor.anchor.setTo(0, 1);
    this.textCursorUpdateTimer = null;
    this.addChild(this.textCursor);

    this.clickHereLabel = game.make.text(0,0,"?", font);
    this.clickHereLabel.anchor.setTo(.5, .5);
    this.clickHereLabel.alpha = .5;
    this.textLabel.addChild(this.clickHereLabel);

    this.keyboardTooltip = null;
    this.keyboardTooltipTween = null;

    this.events.onTextChange = new Phaser.Signal();
    this.enabled = true;
};

// Extends Sprite
GlassLab.UITextInput.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UITextInput.prototype.constructor = GlassLab.UITextInput;

/**
 * @override
 * @private
 */
GlassLab.UITextInput.prototype.SetFocus = function(onOrOff)
{
    GlassLab.UIElement.prototype.SetFocus.call(this, onOrOff);

    if (onOrOff)
    {
        if (this.textLabel.text == "" || this.textLabel.text == " ") // Second check is because phaser puts a space in empty labels
        {
            this.ShowKeyboardTooltip();
        }
    }
    else
    {
        this.HideKeyboardTooltip();
    }
};

GlassLab.UITextInput.prototype._onClick = function()
{
    if (this.enabled) {
        this.SetFocus(true);
    }
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

GlassLab.UITextInput.prototype.ShowKeyboardTooltip = function()
{
    if (!this.keyboardTooltip)
    {
        this.keyboardTooltip = this.game.make.sprite(0,0,"keyboardTooltip");
        this.keyboardTooltip.anchor.setTo(.5, 1);

        this.keyboardTooltip.x = this.width/2;
        this.addChild(this.keyboardTooltip);
    }

    if (!this.keyboardTooltip.visible)
    {
        this.keyboardTooltip.visible = true;
        this.keyboardTooltip.scale.y = 0;
        this.keyboardTooltipTween = this.game.add.tween(this.keyboardTooltip.scale).to({y: 1}, 600, Phaser.Easing.Elastic.Out, true);
        this.keyboardTooltipTween.onComplete.addOnce(function()
        {
            this.keyboardTooltipTween = null;
        }, this);
    }
};

GlassLab.UITextInput.prototype.HideKeyboardTooltip = function()
{
    if (this.keyboardTooltip && this.keyboardTooltip.visible)
    {
        this.keyboardTooltip.visible = false;
        if (this.keyboardTooltipTween)
        {
            this.keyboardTooltipTween.stop(true);
        }
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
                this._addCharFromKeyboardEvent(e);
            }
        }
        this._updateCursor(); // immediately update the cursor position
    }
};

GlassLab.UITextInput.prototype._addCharFromKeyboardEvent = function(e)
{
    var keyCode = e.keyCode;
    if (e.keyCode >= 96 && e.keyCode <= 105) // 0-9 (keypad)
    {
        keyCode -= 48;
    }
    var char = e.shiftKey ? String.fromCharCode(keyCode) : String.fromCharCode(keyCode).toLowerCase(); // TODO: Don't need lower/upper case, but need special symbols
    if (this.textLabel.text == ' ')
    {
        this.textLabel.setText(char);
    }
    else
    {
        this.textLabel.setText(this.textLabel.text + char);
    }

    this.HideKeyboardTooltip();

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

GlassLab.UITextInput.prototype.setEnabled = function(enabled) {
    if (this.bg) {
        this.bg.beginFill(0xffffff).lineStyle(3, (enabled ? 0x000000 : 0xbbbbbb), 1).drawRect(0, 0, 60, 36);
    } else {
        this.alpha = enabled? 1 : 0.5;
    }
    this.enabled = enabled;
    if (!this.enabled) this.SetFocus(false);
};