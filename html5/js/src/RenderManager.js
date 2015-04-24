/**
 * Created by Jerry Fu on 4/23/2015.
 */

var GlassLab = GlassLab || {};


GlassLab.RenderManager = function(game)
{
    this.game = game;

    GlassLab.SignalManager.postUpdate.add(this._onPostUpdate, this);
    GlassLab.SignalManager.initializationComplete.add(this._onPostUpdate, this);

    this.renderLayer = GLOBAL.grassGroup;
};

GlassLab.RenderManager.prototype.AddToIsoWorld = function(child, layerNum)
{
    var layer = child._preOptimizedParent || GLOBAL.creatureLayer;
    if (typeof layerNum == "number")
    {
        if (layerNum >= 0 && layerNum < this.renderLayer.length)
        {
            layer = this.renderLayer.children[layerNum];
        }
        else
        {
            console.error("Could not find layer of index", layerNum);
        }
    }

    if (child.parent === layer)
    {
        console.warn("Tried adding an object to a layer that it was already part of");
        return;
    }

    // Check if outside camera view
    if (GlassLab.RenderManager.IsoObjectOffCamera(child))
    {
        child._preOptimizedParent = layer;
    }
    else
    {
        if (!layer.GLASSLAB_PENDING_ADD_CHILDREN)
        {
            layer.GLASSLAB_PENDING_ADD_CHILDREN = [child];
        }
        else
        {
            layer.GLASSLAB_PENDING_ADD_CHILDREN.push(child);
        }
    }
};

GlassLab.RenderManager.IsoObjectOffCamera = function(child)
{
    var camera = GLOBAL.game.camera;
    return child.x < (camera.x - GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.x &&
        child.y < (camera.y - GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.y &&
        child.x > (camera.x + camera.width + GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.x &&
        child.y > (camera.y + camera.height + GLOBAL.tileSize) / GLOBAL.WorldLayer.scale.y;
};

GlassLab.RenderManager.prototype.RemoveFromIsoWorld = function(child)
{
    if (!child.parent || child.parent.parent != this.renderLayer)
    {
        console.error("Tried to remove child that isn't currently managed by RenderManager");
        return;
    }

    this._preOptimizedParent = child.parent;
    child.parent.removeChild(this);
};

GlassLab.RenderManager.prototype._onPostUpdate = function()
{
    this._updateDirtyLayers();
};

GlassLab.RenderManager.prototype._updateDirtyLayers = function()
{
    for (var i = GLOBAL.grassGroup.children.length-1; i >= 0; i--)
    {
        var renderLayer = GLOBAL.grassGroup.children[i];

        // first add children that are pending add
        if (renderLayer.GLASSLAB_PENDING_ADD_CHILDREN) // Property existence should denote at least one child
        {
            // Pre-sort
            renderLayer.GLASSLAB_PENDING_ADD_CHILDREN.sort(function(a, b)
            {
                if (a.y < b.y)
                {
                    return -1;
                }
                else
                {
                    return 1;
                }
            });

            var addIndex = renderLayer.length; // Intentionally not subtracting one - happens in search loop
            for (var j = renderLayer.GLASSLAB_PENDING_ADD_CHILDREN.length-1; j >= 0; j--)
            {
                var pendingChild = renderLayer.GLASSLAB_PENDING_ADD_CHILDREN[j];
                while(addIndex > 0)
                {
                    if (pendingChild.y <= renderLayer.children[addIndex-1].y)
                    {
                        // Break if correct index found
                        break;
                    }
                    else
                    {
                        // else move to next index
                        addIndex--;
                    }
                }

                renderLayer.addAt(pendingChild, addIndex);
            }

            delete renderLayer.GLASSLAB_PENDING_ADD_CHILDREN;
            renderLayer.GLASSLAB_BITMAP_DIRTY = true;
        }

        // Re-render if dirty
        if (renderLayer.cacheAsBitmap && renderLayer.GLASSLAB_BITMAP_DIRTY)
        {
            renderLayer.updateCache();
            renderLayer.GLASSLAB_BITMAP_DIRTY = false;
        }
    }
};

// Sorts an object in a LAYER. Any other parent container is undefined!
// This function sorts by y value and ASSUMES EVERYTHING IS SORTED EXCEPT THE PASSED IN OBJECT
GlassLab.RenderManager.prototype.UpdateIsoObjectSort = function(obj, layer)
{
    layer = layer || obj.parent;

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
        var neighbor = layer.getAt(childIndex + 1);
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
        var neighbor = layer.getAt(targetIndex + sortDirection);
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
        layer.setChildIndex(obj, targetIndex);
    }
};