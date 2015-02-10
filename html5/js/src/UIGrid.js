/**
 * Created by Jerry Fu on 2/3/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UIGrid
 */
GlassLab.UIGrid = function(game, numColumns, columnWidth, rowHeight, drawBorder)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);

    this.game = game;
    this.managedChildren = [];
    this.drawBorder = drawBorder || false;

    this.colWidth = columnWidth || 100;
    this.rowHeight = rowHeight || 100;
    this.numCols = numColumns || 1;
    this.managedChildren = []; // list of rows, each of which has a number of columns

    if (this.drawBorder)
    {
        this.borderGraphics = game.make.graphics();
        this.addChild(this.borderGraphics);
    }
};

// Extends Sprite
GlassLab.UIGrid.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UIGrid.prototype.constructor = Phaser.UIGrid;

// Adds a child in the next available place
GlassLab.UIGrid.prototype.addManagedChild = function(child, refresh) {
    var done = false;
    for (var row = 0, len = this.managedChildren.length+1; row < len; row++) {
        if (!this.managedChildren[row]) this.managedChildren[row] = [];
        for (var col = 0; col < this.numCols; col++) {
            if (!this.managedChildren[row][col]) { // assume that it won't be a falsey value - it should be a sprite or displayable object
                this.managedChildren[row][col] = child;
                this.addChild(child);
                done = true;
                break;
            }
        }
        if (done) break;
    }

    if (refresh) this.refresh();
};

// Adds a child at the target location (possibly overwriting a previous child
GlassLab.UIGrid.prototype.insertManagedChild = function(child, col, row, refresh)
{
    this.addChild(child);
    if (!this.managedChildren[row]) this.managedChildren[row] = [];
    if (this.managedChildren[row][col]) this.removeChild(this.managedChildren[row][col]); // remove whatever was there before
    this.managedChildren[row][col] = child;

    if (refresh) this.refresh();
};

GlassLab.UIGrid.prototype.removeManagedChildren = function(refresh)
{
    for (var row = 0, len = this.managedChildren.length; row < len; row++) {
        for (var col = 0; col < this.numCols; col++) {
            if (this.managedChildren[row][col]) { // assume that it won't be a falsey value - it should be a sprite or displayable object
                this.removeChild(this.managedChildren[row][col]);
                this.managedChildren[row][col] = null;
            }
        }
    }
    if (refresh) this.refresh();
};

GlassLab.UIGrid.prototype.refresh = function()
{
    if (this.borderGraphics) {
        this.borderGraphics.clear().lineStyle(2, 0x0000ff, 1);
    }

    // place all the items in the grid
    for (var row = 0, len = this.managedChildren.length; row < len; row++) {
        for (var col = 0; col < this.numCols; col++) {
            if (this.managedChildren[row][col]) {
                this.managedChildren[row][col].x = (col + 0.5) * this.colWidth;
                this.managedChildren[row][col].y = (row + 0.5) * this.rowHeight;
            }
        }
        if (this.borderGraphics) { // draw horizontal lines
            var y = row * this.rowHeight;
            this.borderGraphics.moveTo(0, y).lineTo(this.getWidth(), y);
        }
    }
    // draw the vertical lines
    if (this.borderGraphics) {
        var y = (this.managedChildren.length) * this.rowHeight;
        this.borderGraphics.moveTo(0, y).lineTo(this.getWidth(), y); // last horizontal line

        for (var col = 0; col < this.numCols + 1; col++) {
            var x = col * this.colWidth;
            this.borderGraphics.moveTo(x, 0).lineTo(x, this.getHeight());
        }
    }
};

GlassLab.UIGrid.prototype.getWidth = function() {
    return this.colWidth * this.numCols;
};

GlassLab.UIGrid.prototype.getHeight = function() {
    return this.rowHeight * this.managedChildren.length;
};