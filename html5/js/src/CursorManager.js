///////////////////////////////////////////////////////////////////////////////////////
// CSS3 cursor management for canvas/HTML5 games wrapped up in singleton CURSOR object
// - typically cursors are set on a per element basis, but in this case we will
// - set the cursor for the canvas div element as a whole, at various times, as
// - determined by game logic.
//
// Usage (setup):
// - CURSOR.getManager().setTargetElementID('container'); // 'container' being an example canvas id.
// - CURSOR.getManager().addCursor('default', 'assets/images/cursors/pointer_default.png');
// - CURSOR.getManager().addCursor('button', 'assets/images/cursors/pointer_button.png');
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
	this._cursors = {}; // dictionary of custom cursor names and img rsc urls.
};

CURSOR.Manager.prototype = {

	constructor: CURSOR.Manager,

	setTargetElementID: function(name) {
		// saves DOM element ID string for use when setting the cursor later:
		if (!document.getElementById(name))
			console.warn("CURSOR: setElementID(): No such DOM element '" + name + "' for use with CURSOR. Saving configuration anyway.");

		this._element_id = name;
	},

	addCursor: function(name, resource_url) {
		// add new url image resource to dictionary of possible custom cursors:
		if (typeof(this._cursors[name]) != "undefined")
			console.warn("CURSOR: addCursor(): overwriting previous configuration for cursor name '" + name + "'.");

		this._cursors[name] = resource_url;
	},

	setCursor: function(name) {
		// check to make sure element_id is set first:
		if (this._element_id == null) {
			console.error("CURSOR: setCursor(): must use setTargetElementID() before setCursor().");
			return;
		}

		// apply cursor CSS to this._element_id:
		if (typeof(this._cursors[name]) != "undefined") {
			// good to go:
			if (document.getElementById(this._element_id))
				document.getElementById(this._element_id).style.cursor = "url(" + this._cursors[name] + "), auto"; // add "auto" as a fallback.
			else
				console.error("CURSOR: setCursor(): Assigned DOM element '" + name + "' not found, bailing.");
		}
		else {
			console.warn("CURSOR: setCursor(): Cursor name '" + name + "' not configured, bailing.");
		}
	},
	
};
