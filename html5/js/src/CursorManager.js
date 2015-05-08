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

	// member vars:
	this._element_id = null; // likely to be set to the id of canvas element, or other game container
	this._cursors = {}; // dictionary of custom cursor names, img rsc urls, and regXY's.

    this._cursorRequests = []; // list of cursor requests: {source: requestingObj, name: cursorName}
};

CURSOR.Manager.prototype = {

	constructor: CURSOR.Manager,

	setTargetElementID: function(name) {
		// saves DOM element ID string for use when setting the cursor later:
		if (!document.getElementById(name))
			console.warn("CURSOR: setElementID(): No such DOM element '" + name + "' for use with CURSOR. Saving configuration anyway.");

		this._element_id = name;
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
		// check to make sure element_id is set first:
		if (this._element_id == null) {
			console.error("CURSOR: setCursor(): must use setTargetElementID() before setCursor().");
			return;
		}

		// apply cursor CSS to this._element_id:
		if (name == "none" || typeof(this._cursors[name]) != "undefined") { // "none" is a special case
			// good to go:
			if (document.getElementById(this._element_id)) {
                if (name == "none") {
                    document.getElementById(this._element_id).style.cursor = 'none';
                } else {
                    document.getElementById(this._element_id).style.cursor = "url(" + this._cursors[name].src + ") " + this._cursors[name].regX + " " + this._cursors[name].regY + ", auto"; // add "auto" as a fallback.
                }
            } else
				console.error("CURSOR: setCursor(): Assigned DOM element '" + this._element_id + "' not found, bailing.");
		}
		else {
			console.warn("CURSOR: setCursor(): Cursor name '" + name + "' not configured, bailing.");
		}
	},

    // We may need to consider applying multiple cursor styles depending on the situation
    requestCursor: function(source, name) {
        this._cursorRequests.push({source: source, name: name});
        console.log("request", name, this._cursorRequests.length);
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
        console.log("unrequest", name, this._cursorRequests.length);
        this.chooseCursor();
    },

    // clear all requests
    clearRequests: function() {
        this._cursorRequests = [];
        this.chooseCursor();
    },

    chooseCursor: function() {
        var name = "default";
        var priorities = ["grab_open", "button", "grab_closed", "none"]; // later names take priority over earlier ones
        var currentPriority = -1;
        for (var i = 0; i < this._cursorRequests.length; i++) {
            var req = this._cursorRequests[i];
            var priority = priorities.indexOf(req.name);
            if (priority > currentPriority) {
                name = req.name;
                currentPriority = priority;
            }
        }
        this.setCursor(name);
    }
};
