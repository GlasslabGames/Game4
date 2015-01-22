/**
 * Created by Jerry Fu on 1/22/2015.
 */

var GlassLab = GlassLab || {};

/**
 * UITable
 */
GlassLab.UITable = function(game, numColumns, padding)
{
    Phaser.Sprite.prototype.constructor.call(this, game);

    this.game = game;
    this.managedChildren = [];

    this.padding = padding;
    this._rowHeights = [];
    this._columnLengths = [];
    this._columns = numColumns;
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
    // First refresh column and row sizes
    var numChildren = this.managedChildren.length;
    for (var i=0; i < numChildren; i++)
    {
        var child = this.managedChildren[i];
        if (child)
        {
            var row = i / this._columns;
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
            var row = i / this._columns;
            var column = i % this._columns;
            var rowIterator = row - 1;
            var lengthIterator = column - 1;
            var x = column * this.padding;
            while (lengthIterator >= 0)
            {
                x += this._columnLengths[lengthIterator--];
            }
            var y = row * this.padding;
            while (rowIterator >= 0)
            {
                y += this._rowHeights[rowIterator--];
            }

            child.x = x;
            child.y = y;
        }
    }
};
