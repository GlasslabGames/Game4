/**
 * Created by Jerry Fu on 4/23/2015.
 */

var GlassLab = GlassLab || {};


GlassLab.RenderManager = function(game)
{
    this.game = game;

};

// Sorts an object in GLOBAL.creatureLayer, but can easily be changed to sort any layer.
// This function sorts by y value and ASSUMES EVERYTHING IS SORTED EXCEPT THE PASSED IN OBJECT
GlassLab.RenderManager.prototype.UpdateIsoObjectSort = function(obj)
{
    var childIndex = GLOBAL.creatureLayer.getIndex(obj);
    if (childIndex == -1)
    {
        console.error("Tried to sort an object that isn't in the creature layer.")
        return;
    }

    // Figure out whether or not we're sorting the object upward in array (1) or downward (-1)
    var sortDirection = 0;
    var numChildren = GLOBAL.creatureLayer.length;
    if (childIndex == 0)
    {
        sortDirection = 1;
    }
    else if (childIndex == numChildren-1)
    {
        sortDirection = -1;
    }
    else
    {
        var neighbor = GLOBAL.creatureLayer.getAt(childIndex + 1);
        if (obj.y > neighbor.y)
        {
            sortDirection = 1;
        }
        else
        {
            sortDirection = -1;
        }
    }

    // Go in the direction determined TODO: Skip over neighbor that was already checked?
    var targetIndex = childIndex;
    while (targetIndex >= 0 && targetIndex < numChildren)
    {
        var neighbor = GLOBAL.creatureLayer.getAt(targetIndex + sortDirection);
        if (-Math.sign(neighbor.y - obj.y) == sortDirection)
        {
            targetIndex += sortDirection;
        }
        else
        {
            break;
        }
    }

    // Change indices if the indices actually need to be changed
    if (targetIndex != childIndex)
    {
        GLOBAL.creatureLayer.setChildIndex(obj, targetIndex);
    }
};
