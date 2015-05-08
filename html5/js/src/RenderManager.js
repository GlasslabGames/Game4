/**
 * Created by Jerry Fu on 4/23/2015.
 */

var GlassLab = GlassLab || {};


GlassLab.RenderManager = function(game)
{
    this.game = game;

    GlassLab.SignalManager.postUpdate.add(this._onPostUpdate, this);
    GlassLab.SignalManager.initializationComplete.add(this._onPostUpdate, this);

    this.layers = [];
    for (var i=0; i < 7; i++)
    {
        this.layers.push(this.game.make.group());
        GLOBAL.WorldLayer.add(this.layers[i]);
    }

    GLOBAL.groundLayer = this.layers[0];

    GLOBAL.baseWorldLayer = this.layers[1];

    GLOBAL.penLayer = this.layers[2];

    GLOBAL.foodLayer = this.layers[3];

    GLOBAL.creatureLayer = this.layers[4]; // Created by TileManager now

    GLOBAL.effectLayer = this.layers[5];

    GLOBAL.hoverLayer = this.layers[6];
};
GLOBAL.OPTIMIZE_CHILD_USING_VISIBLE = false;
GlassLab.RenderManager.prototype.AddToIsoWorld = function(child)
{
    var layer = child.parent || child._preOptimizedParent;

    // Check if outside camera view
    if (GlassLab.RenderManager.IsoObjectOffCamera(child))
    {
    }
    else
    {
        if (!GLOBAL.OPTIMIZE_CHILD_USING_VISIBLE)
        {
            var childIndex = this.GetIsoObjectTargetIndex(child, layer);
            layer.addAt(child, childIndex, true);
        }
        else
        {
            child.visible = true;
            this.UpdateIsoObjectSort(child);
            child.parent.GLASSLAB_BITMAP_DIRTY = true;
        }

    }
};

GlassLab.RenderManager.IsoObjectOffCamera = function(child)
{
    var camera = GLOBAL.game.camera;
    return child.x < (camera.x - GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.x ||
        child.y < (camera.y - GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.y ||
        child.x > (camera.x + camera.width + GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.x ||
        child.y > (camera.y + camera.height + GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.y;
};

GlassLab.RenderManager.prototype.RemoveFromIsoWorld = function(child)
{
    if (GLOBAL.OPTIMIZE_CHILD_USING_VISIBLE)
    {
        child.visible = false;
    }
    else
    {
        if (!child.parent)
        {
            console.error("RemoveFromIsoWorld called on child with no parent");
            return;
        }

        child._preOptimizedParent = child.parent;
        child.parent.removeChild(child);
    }
};

GlassLab.RenderManager.prototype._onPostUpdate = function()
{
    this._updateDirtyLayers();
};

GlassLab.RenderManager.prototype._updateDirtyLayers = function()
{
    for (var i = this.layers.length-1; i >= 0; i--)
    {
        var renderLayer = this.layers[i];
        // Re-render if dirty
        if (renderLayer.cacheAsBitmap && renderLayer.GLASSLAB_BITMAP_DIRTY)
        {
            renderLayer.GLASSLAB_BITMAP_DIRTY = false;
            renderLayer.updateCache();
        }
    }
};

// Sorts an object in a LAYER. Any other parent container is undefined!
// This function sorts by y value and ASSUMES EVERYTHING IS SORTED EXCEPT THE PASSED IN OBJECT
GlassLab.RenderManager.prototype.UpdateIsoObjectSort = function(obj)
{
    var layer = obj.parent;

    if (!layer.getIndex)
    {
        console.warn("Tried to sort object that isn't in a render layer");
        return;
    }

    var childIndex = layer.getIndex(obj);
    if (childIndex == -1)
    {
        console.error("Tried to sort an object that isn't in the passed in parent layer.");
        return;
    }

    // Figure out whether or not we're sorting the object upward in array (1) or downward (-1)
    var sortDirection = 0;
    var numChildren = layer.length;
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
        var scanIndex = 2;
        var neighbor = layer.getAt(childIndex + 1);
        while (!neighbor.visible)
        {
            if (childIndex + scanIndex == numChildren)
            {
                sortDirection = -1;
                break;
            }
            neighbor = layer.getAt(childIndex + scanIndex);
            scanIndex++;
        }

        if (neighbor.visible)
        {
            if (obj.y > neighbor.y)
            {
                sortDirection = 1;
            }
            else
            {
                sortDirection = -1;
            }
        }
    }

    // Go in the direction determined TODO: Skip over neighbor that was already checked?
    var targetIndex = childIndex;
    while (targetIndex > 0 && targetIndex < numChildren-1)
    {
        var neighbor = layer.getAt(targetIndex + sortDirection);
        if (!neighbor.visible || -Math.sign(neighbor.y - obj.y) == sortDirection)
        {
            targetIndex += sortDirection;
        }
        else
        {
            break;
        }
    }

    GlassLab.Util.SetChildIndexInPlace(layer.children, obj, targetIndex);
};

GlassLab.RenderManager.prototype.GetIsoObjectTargetIndex = function(obj, layer)
{
    layer = layer || obj.parent;

    // Figure out whether or not we're sorting the object upward in array (1) or downward (-1)
    var numChildren = layer.length;
    var targetIndex = 0;
    while (targetIndex < numChildren)
    {
        var neighbor = layer.getAt(targetIndex);
        if (!neighbor.visible || obj.y - neighbor.y > 0)
        {
            targetIndex++;
        }
        else
        {
            break;
        }
    }

    return targetIndex;
};