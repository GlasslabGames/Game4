/**
 * Created by Jerry Fu on 2/18/2015.
 */

var GlassLab = GlassLab || {};

/**
 * Pen Manager
 */

GlassLab.PenManager = function(game) {
    this.game = game;

    this.pens = [];

    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
    GlassLab.SignalManager.gameLoaded.add(this._onGameLoaded, this);
};

GlassLab.PenManager.prototype.AddPen = function(pen)
{
    this.pens.push(pen);
};

GlassLab.PenManager.prototype.RemovePen = function(pen)
{
    var penIndex = this.pens.indexOf(pen);
    if (penIndex != -1)
    {
        this.pens.splice(penIndex, 1);
    }
    else
    {
        console.error("Tried to remove pen that isn't managed");
    }
};

GlassLab.PenManager.prototype.CreatePen = function(penData, col, row)
{
    var widths = [
        (penData.creatureWidth || 1),
        (penData.foodWidth || penData.foodAWidth || 1)
    ];
    if (penData.foodBWidth) widths.push(penData.foodBWidth);

    var pen = new GlassLab.FeedingPen(
        this.game,
        GLOBAL.penLayer,
        penData.type,
        (penData.height || 1),
        widths,
        penData.autoFill
    );

    if (col) pen.sprite.isoX = col * GLOBAL.tileSize;
    if (row) pen.sprite.isoY = row * GLOBAL.tileSize;
    if (col || row) pen.Resize();

    pen.targetNumCreatures = penData.targetNumCreatures;

    // set which edges are adjustable here (defaults to the right side only)
    if (penData.leftDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.left);
    if (penData.bottomDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.bottom);
    if (penData.topDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.top);
    if (penData.draggableEdges) pen.SetDraggable.call(pen, penData.draggableEdges);

    // Record that the details of the pen for the challenge info. If this function stops being 1:1 to a pen challenge we'll have to change it
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(pen.creatureType);
    GlassLabSDK.saveTelemEvent("pen_initialized", {
        creature_type: pen.creatureType || "",
        foodA_type: pen.foodTypes[0] || "",
        foodB_type: pen.foodTypes[1] || "",
        target_foodA_type: creatureInfo.desiredFood[0].type,
        target_foodB_type: (creatureInfo.desiredFood[1]? creatureInfo.desiredFood[1].type : ""),
        rows: pen.height,
        creature_columns: pen.widths[0],
        foodA_columns: pen.widths[1],
        foodB_columns: pen.widths[2] || 0,
        pen_dimensions: pen.getDimensionEncoding(),
        target_pen_dimensions: pen.getTargetDimensionEncoding(),
        pen_id: pen.id, // fix if we have multiple pens
        top_moveable: pen.topEdge.draggable,
        left_moveable: pen.leftEdge.draggable,
        right_moveable: pen.rightEdges[0].draggable, // even if there are multiple right edges, we can just check one
        bottom_moveable: pen.bottomEdge.draggable
    });

    return pen;

};

GlassLab.PenManager.prototype.DestroyAllPens = function()
{
    // For now just destroy all sprites on the pen and creature layers.
    for (var i = GLOBAL.penLayer.children.length-1; i>=0; i--) {
        GLOBAL.penLayer.getChildAt(i).destroy();
    }

    this.pens = [];
};

GlassLab.PenManager.prototype._onSaveRequested = function(blob)
{
    blob.pens = [];

    for (var i=0, j=this.pens.length; i < j; i++)
    {
        var pen = this.pens[i];
        var penBlob = {
            type: pen.creatureType,
            width: pen.width,
            height: pen.height,
            foodAWidth: pen.foodAWidth,
            foodBWidth: pen.foodBWidth,
            draggableEdges: []
        };

        for (var edgeIndex = 0; edgeIndex < pen.edges.length; edgeIndex++)
        {
            if (pen.edges[edgeIndex].draggable)
            {
                penBlob.draggableEdges.push(pen.edges[edgeIndex].side);
            }
        }

        blob.pens.push(penBlob);
    }
};

GlassLab.PenManager.prototype._onGameLoaded = function(blob)
{
    this.DestroyAllPens();

    for (var i=0, j=blob.pens.length; i < j; i++)
    {
        var penData = blob.pens[i];

        this.CreatePen(penData);
    }
};