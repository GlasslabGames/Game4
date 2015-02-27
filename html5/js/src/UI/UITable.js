/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UITable
 */
GlassLab.UITable = function(game, numColumns, padding, drawBorder)
{
    GlassLab.UIElement.prototype.constructor.call(this, game);

    this.game = game;
    this.managedChildren = [];
    this.drawBorder = drawBorder || false;

    this.padding = padding || 0;
    this._rowHeights = [];
    this._columnLengths = [];
    this._columns = numColumns || 1;

    if (this.drawBorder)
    {
        this._borderGraphics = game.make.graphics();
        this.addChild(this._borderGraphics);
    }
};

// Extends Sprite
GlassLab.UITable.prototype = Object.create(GlassLab.UIElement.prototype);
GlassLab.UITable.prototype.constructor = GlassLab.UITable;

GlassLab.UITable.prototype.addManagedChild = function(child, refresh)
{
    this.addChild(child);
    this.managedChildren.push(child);
    if (child.events.uiChanged) child.events.uiChanged.add(this._onChildChanged, this);

    if (refresh)
    {
        this._refresh();
    }
};

GlassLab.UITable.prototype._onChildChanged = function(child)
{
    this._refresh();
};

GlassLab.UITable.prototype.replaceChildAt = function(x, y, child)
{
    var index = x + y*this.cellWidth;

    var prevChild = this.managedChildren[index];
    this.managedChildren[index] = child;
};

GlassLab.UITable.prototype._refresh = function()
{
    // TODO: Possible to optimize the loops to not calculate row/column every iteration
    // First refresh column and row sizes
    var numChildren = this.managedChildren.length;
    for (var i=0; i < numChildren; i++)
    {
        var child = this.managedChildren[i];
        if (child)
        {
            var row = parseInt(i / this._columns);
            var column = i % this._columns;
            // If we have our own height and width calculations (e.g. in UIButton) use those instead
            var height = (child.getHeight)? child.getHeight() : child.height;
            var width = (child.getWidth)? child.getWidth() : child.width;

            // Insert element if missing
            if (this._rowHeights.length <= row)
            {
                this._rowHeights[row] = height;
            }
            else // Replace element with highest value
            {
                this._rowHeights[row] = Math.max(height, this._rowHeights[row]);
            }

            if (this._columnLengths.length <= column)
            {
                this._columnLengths[column] = width;
            }
            else
            {
                this._columnLengths[column] = Math.max(width, this._columnLengths[column]);
            }
        }
    }

    // Then lay out objects
    for (var i=0; i < numChildren; i++)
    {
        var child = this.managedChildren[i];
        if (child)
        {
            var row = parseInt(i / this._columns);
            var column = i % this._columns;
            var rowIterator = row - 1;
            var lengthIterator = column - 1;
            var x = column * this.padding;
            while (lengthIterator >= 0)
            {
                x += this._columnLengths[lengthIterator--];
            }
            var y = (row) * this.padding;
            while (rowIterator >= 0)
            {
                y += this._rowHeights[rowIterator--];
            }

            child.x = x;
            child.y = y;
        }
    }

    if (this.drawBorder)
    {
        var totalLength = (this._columns-1) * this.padding;
        var lengthIterator = this._columns-1;
        while (lengthIterator >= 0) totalLength += this._columnLengths[lengthIterator--];

        var totalHeight = (numChildren / this._columns-1 ) * this.padding;
        var heightIterator = numChildren / this._columns - 1;
        while (heightIterator >= 0) totalHeight += this._rowHeights[heightIterator--];

        this._borderGraphics.clear();

        this._borderGraphics.beginFill(0xFFFFFF)
            .drawRect(-this.padding,-this.padding,totalLength + this.padding, this.padding) // top
            .drawRect(-this.padding,-this.padding,this.padding,totalHeight+this.padding) // left
            .drawRect(totalLength, -this.padding, this.padding, totalHeight + this.padding) // right
            .drawRect(-this.padding, totalHeight, totalLength + this.padding * 2, this.padding); // bottom

        var rows = parseInt(numChildren / this._columns);
        var columns = this._columns;

        this._borderGraphics.beginFill(0xFF0000);
        for (var i=0; i < rows-1; i++)
        {
            var y = this.getRowYCoord(i);
            for (var j=0; j < columns-1; j++)
            {
                var x = this.getColumnXCoord(j);
                this._borderGraphics.drawRect(x, 0, this.padding, totalHeight); // vertical
            }

            this._borderGraphics.drawRect(0, y, totalLength, this.padding); // vertical
            // horizontal
        }


    }
};

GlassLab.UITable.prototype.getColumnXCoord = function(columnNum) {
    var totalLength = columnNum;
    var lengthIterator = columnNum;
    totalLength *= this.padding;
    while (lengthIterator >= 0) totalLength += this._columnLengths[lengthIterator--];

    return totalLength;
};

GlassLab.UITable.prototype.getRowYCoord = function(rowNum) {

    var totalHeight = rowNum;
    var widthIterator = rowNum;
    totalHeight *= this.padding;
    while (widthIterator >= 0) totalHeight += this._rowHeights[widthIterator--];

    return totalHeight;
};

GlassLab.UITable.prototype.getWidth = function() {
  var width = 0;
  for (var j=0; j < this._columnLengths.length; j++)
  {
    width += this._columnLengths[j] + this.padding;
  }
  width -= this.padding; // because an extra was added at the end
  return width;
};


GlassLab.UITable.prototype.getHeight = function() {
  var height = 0;
  for (var j=0; j < this._rowHeights.length; j++)
  {
    height += this._rowHeights[j] + this.padding;
  }
  height -= this.padding; // because an extra was added at the end
  return height;
};