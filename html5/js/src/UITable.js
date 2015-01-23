/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UITable
 */
GlassLab.UITable = function(game, numColumns, padding, drawBorder)
{
    Phaser.Sprite.prototype.constructor.call(this, game);

    this.game = game;
    this.managedChildren = [];
    this.drawBorder = drawBorder || false;

    this.padding = padding;
    this._rowHeights = [];
    this._columnLengths = [];
    this._columns = numColumns;

    if (this.drawBorder)
    {
        this._borderGraphics = game.make.graphics();
        this.addChild(this._borderGraphics);
    }
};

// Extends Sprite
GlassLab.UITable.prototype = Object.create(Phaser.Sprite.prototype);
GlassLab.UITable.prototype.constructor = Phaser.UITable;

GlassLab.UITable.prototype.addManagedChild = function(child, refresh)
{
    this.addChild(child);
    this.managedChildren.push(child);

    if (refresh)
    {
        this._refresh();
    }
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

            // Insert element if missing
            if (this._rowHeights.length <= row)
            {
                this._rowHeights[row] = child.height;
            }
            else // Replace element with highest value
            {
                this._rowHeights[row] = Math.max(child.height, this._rowHeights[row]);
            }

            if (this._columnLengths.length <= column)
            {
                this._columnLengths[column] = child.width;
            }
            else
            {
                this._columnLengths[column] = Math.max(child.width, this._columnLengths[column]);
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
