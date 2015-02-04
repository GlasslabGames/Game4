/**
 * Created by Jerry Fu on 2/3/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UIGrid
 */
GlassLab.UIGrid = function(game, numColumns, padding, drawBorder)
{
    Phaser.Sprite.prototype.constructor.call(this, game);

    this.game = game;
    this.managedChildren = [];
    this.drawBorder = drawBorder || false;

    this.padding = padding || 0;
    this._columns = numColumns || 1;

    if (this.drawBorder)
    {
        this._borderGraphics = game.make.graphics();
        this.addChild(this._borderGraphics);
    }
};

// Extends Sprite
GlassLab.UIGrid.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UIGrid.prototype.constructor = Phaser.UIGrid;

GlassLab.UIGrid.prototype.addManagedChild = function(child, refresh)
{
    this.addChild(child);
    this.managedChildren.push(child);

    if (refresh)
    {
        this._refresh();
    }
};

GlassLab.UIGrid.prototype.replaceChildAt = function(x, y, child)
{
    var index = x + y*this.cellWidth;

    var prevChild = this.managedChildren[index];
    this.managedChildren[index] = child;
};

GlassLab.UIGrid.prototype._refresh = function()
{
};

GlassLab.UIGrid.prototype.getColumnXCoord = function(columnNum) {
    var totalLength = columnNum;
    var lengthIterator = columnNum;
    totalLength *= this.padding;
    while (lengthIterator >= 0) totalLength += this._columnLengths[lengthIterator--];

    return totalLength;
};

GlassLab.UIGrid.prototype.getRowYCoord = function(rowNum) {

    var totalHeight = rowNum;
    var widthIterator = rowNum;
    totalHeight *= this.padding;
    while (widthIterator >= 0) totalHeight += this._rowHeights[widthIterator--];

    return totalHeight;
};

GlassLab.UIGrid.prototype.getWidth = function() {
    var width = 0;
    for (var j=0; j < this._columnLengths.length; j++)
    {
        width += this._columnLengths[j] + this.padding;
    }
    width -= this.padding; // because an extra was added at the end
    return width;
};


GlassLab.UIGrid.prototype.getHeight = function() {
    var height = 0;
    for (var j=0; j < this._rowHeights.length; j++)
    {
        height += this._rowHeights[j] + this.padding;
    }
    height -= this.padding; // because an extra was added at the end
    return height;
};