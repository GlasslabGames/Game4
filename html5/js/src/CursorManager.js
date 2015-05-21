///////////////////////////////////////////////////////////////////////////////////////
// CSS3 cursor management for canvas/HTML5 games wrapped up in singleton CURSOR object
// - typically cursors are set on a per element basis, but in this case we will
// - set the cursor for the canvas div element as a whole, at various fun times, as
// - determined by game logic.
//
// Usage (setup):
// - CURSOR.getManager().setTargetElementID('container'); // 'container' being an example canvas id.
// - CURSOR.getManager().addCursor('default', 'assets/images/cursors/pointer_default.png', 10, 10); // regX,Y = 10,10 from top left
// - CURSOR.getManager().addCursor('button', 'assets/images/cursors/pointer_button.png', 10, 10);
//
// Usage (to change cursor during game):
// - CURSOR.getManager().setCursor('button');
///////////////////////////////////////////////////////////////////////////////////////


var CURSOR = CURSOR || {};


// private members:
CURSOR._manager = null;


// public methods:
CURSOR.getManager = function() {
	if (CURSOR._manager == null)
		CURSOR._manager = new CURSOR.Manager();

	return CURSOR._manager;
};


// CURSOR.Manager object:
CURSOR.Manager = function() {

	if (CURSOR._manager == null)
		CURSOR._manager = this;
	else
		console.warn("WARNING: CURSOR.Manager should probably only be created once.");

    GlassLab.SignalManager.update.add(this.update, this);

	// member vars:
    this._element = null; // likely to be set to the id of canvas element, or other game container
	this._cursors = {}; // dictionary of custom cursor names, img rsc urls, and regXY's.

    this._cursorRequests = []; // list of cursor requests: {source: requestingObj, name: cursorName}
    this._hoverCursorName = "default"; // this will be updated whenever the mouse is over something

    this._replaceCursor = true; // if this is true, the cursor will be hidden and replaced with a sprite. Else, the cursor's style will be changed.
    // Changing the cursor style was very laggy, so we're replacing it instead.

    this._cursorSprite = null;
    this._offsetX = this._offsetY = 0;

    this._mouseOver = true; // tracks whether the mouse is over the element or not
};

CURSOR.Manager.prototype = {

	constructor: CURSOR.Manager,

	setTargetElementID: function(name) {
        var newElement = document.getElementById(name);
        // saves DOM element ID string for use when setting the cursor later:
		if (!newElement) {
            console.warn("CURSOR: setElementID(): No such DOM element '" + name + "' for use with CURSOR. Saving configuration anyway.");
        } else {
            if (this._element && this._element != newElement) {
                this._element.removeEventListener("mouseout", this.onMouseOut);
                this._element.removeEventListener("mouseover", this.onMouseOver);
            }

            this._element = newElement;
            this._element.addEventListener("mouseout", this.onMouseOut);
            this._element.addEventListener("mouseover", this.onMouseOver);
        }
	},

    onMouseOut: function() {
        if (!GLOBAL.cursorManager) return;
        GLOBAL.cursorManager._mouseOver = false;
        if (GLOBAL.cursorManager._replaceCursor && GLOBAL.cursorManager._cursorSprite) GLOBAL.cursorManager._cursorSprite.visible = false;
    },

    onMouseOver: function() {
        if (!GLOBAL.cursorManager) return;
        GLOBAL.cursorManager._mouseOver = true;
        if (GLOBAL.cursorManager._replaceCursor && GLOBAL.cursorManager._cursorSprite) GLOBAL.cursorManager._cursorSprite.visible = true;
    },

    setCursorSprite: function(sprite) {
        this._replaceCursor = true;
        this._cursorSprite = sprite;
    },

	addCursor: function(name, resource_url, reg_x, reg_y) {
		// set reg_x and _y to 0,0 if not defined:
		if (typeof(reg_x) == "undefined")
			reg_x = 0;
		if (typeof(reg_y) == "undefined")
			reg_y = 0;

		// add new url image resource to dictionary of possible custom cursors:
		if (typeof(this._cursors[name]) != "undefined")
			console.warn("CURSOR: addCursor(): overwriting previous configuration for cursor name '" + name + "'.");

		this._cursors[name] = { src: resource_url, regX: reg_x, regY: reg_y };
	},

	setCursor: function(name) {
        //console.log("CURSOR: setCursor(",name,")");

        if (this._replaceCursor && !this._cursorSprite) {
            console.error("CURSOR: setCursor(): must use setTargetElementID() before setCursor().");
            return;
        } else if (!this._replaceCursor && !this._element) {
			console.error("CURSOR: setCursor(): must use setTargetElementID() before setCursor().");
			return;
		}

		// apply cursor CSS to this._element_id:
		if (name == "none" || typeof(this._cursors[name]) != "undefined") { // "none" is a special case
			// good to go:
            if (this._replaceCursor) {
                if (!this._mouseOver || name == "none") this._cursorSprite.visible = false;
                else {
                    this._cursorSprite.visible = true;
                    this._cursorSprite.loadTexture(name);
                    this._offsetX = this._cursors[name].regX;
                    this._offsetY = this._cursors[name].regY;
                }
            } else {
                if (name == "none") {
                    this._element.style.cursor = 'none';
                } else {
                    this._element.style.cursor = "url(" + this._cursors[name].src + ") " + this._cursors[name].regX + " " + this._cursors[name].regY + ", auto"; // add "auto" as a fallback.
                }
            }
		}
		else {
			console.warn("CURSOR: setCursor(): Cursor name '" + name + "' not configured, bailing.");
		}
	},

    // We may need to consider applying multiple cursor styles depending on the situation
    requestCursor: function(source, name) {
        this._cursorRequests.push({source: source, name: name});
        this.chooseCursor();
    },

    // end a request for a certain cursor (or all cursors if name is null)
    unrequestCursor: function(source, name) {
        for (var i = this._cursorRequests.length - 1; i >= 0; i--) {
            var req = this._cursorRequests[i];
            if (req.source == source && (!name || req.name == name)) {
                this._cursorRequests.splice(i, 1);
            }
        }
        this.chooseCursor();
    },

    // clear all requests
    clearRequests: function() {
        this._cursorRequests = [];
        this.chooseCursor();
    },

    chooseCursor: function() {
        var name = this._hoverCursorName; // stick with this cursor unless one of the requests has a higher priority.
        var priorities = ["default", "grab_open", "button", "grab_closed", "none"]; // later names take priority over earlier ones
        var currentPriority = priorities.indexOf(name);
        for (var i = 0; i < this._cursorRequests.length; i++) {
            var req = this._cursorRequests[i];
            var priority = priorities.indexOf(req.name);
            if (priority > currentPriority) {
                name = req.name;
                currentPriority = priority;
            }
        }
        this.setCursor(name);
    },

    update: function() {
        var name = "default";
        if (GLOBAL.game && GLOBAL.game.input.activePointer.targetObject && GLOBAL.game.input.activePointer.targetObject.customHoverCursor) {
            var sprite = GLOBAL.game.input.activePointer.targetObject.sprite;
            if (!sprite || !("enabled" in sprite) || sprite.enabled) {
                name = GLOBAL.game.input.activePointer.targetObject.customHoverCursor;
            }
        }

        if (name != this._hoverCursorName) {
            this._hoverCursorName = name;
            this.chooseCursor(name); // we only want to call this if something has changed
        }
    },

    // called from a render function for highest accuracy
    updateCursorPos: function() {
        if (this._replaceCursor && this._cursorSprite && GLOBAL.game) {
            var mousePoint = new Phaser.Point(GLOBAL.game.input.activePointer.worldX, GLOBAL.game.input.activePointer.worldY);
            this._cursorSprite.x = mousePoint.x - this._offsetX;
            this._cursorSprite.y = mousePoint.y - this._offsetY;

            this._cursorSprite.parent.bringToTop(this._cursorSprite); // make sure the cursor is on top
        }
    }
};
