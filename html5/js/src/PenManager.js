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
    else { // Add a 3rd section if the creature wants more than 1 kind of food
        var info = GLOBAL.creatureManager.GetCreatureData(penData.type || penData.creatureType);
        if (info && info.desiredFood.length > 1) widths.push(1);
    }

    var pen = new GlassLab.FeedingPen(
        this.game,
        GLOBAL.penLayer,
        penData.type || penData.creatureType,
        (penData.height || 1),
        widths,
        penData.autoFill
    );

    col = col || penData.startCol || -5;
    row = row || penData.startRow;
    if (col) pen.sprite.isoX = col * GLOBAL.tileSize;
    if (row) pen.sprite.isoY = row * GLOBAL.tileSize;
    if (col || row) pen.Resize();

    pen.targetNumCreatures = penData.targetNumCreatures || penData.numCreatures;
    pen.maxHeight = penData.maxHeight;

    // set which edges are adjustable here (defaults to the right side only)
    if (penData.leftDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.left);
    if (penData.bottomDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.bottom);
    if (penData.topDraggable) pen.SetDraggable(GlassLab.Edge.SIDES.top);
    if (penData.draggableEdges) pen.SetDraggable.call(pen, penData.draggableEdges);

    // Record that the details of the pen for the challenge info. If this function stops being 1:1 to a pen challenge we'll have to change it
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(pen.creatureType);
    GlassLabSDK.saveTelemEvent("pen_initialized", {
        target_creature_type: pen.creatureType || "",
        rows: pen.height,
        creature_columns: pen.widths[0],
        foodA_columns: pen.widths[1],
        foodB_columns: pen.widths[2] || 0,
        pen_dimensions: pen.getDimensionEncoding(),
        target_pen_dimensions: pen.getTargetDimensionEncoding(),
        pen_id: pen.id,
        top_moveable: pen.topEdge.draggable,
        left_moveable: pen.leftEdge.draggable,
        right_moveable: pen.rightEdges[0].draggable, // even if there are multiple right edges, we can just check one
        bottom_moveable: pen.bottomEdge.draggable
    });

    return pen;
};

GlassLab.PenManager.prototype.hidePens = function() {
    for (var i = 0; i < this.pens.length; i++) {
        this.pens[i].hide();
    }
};

GlassLab.PenManager.prototype.showPens = function() {
    for (var i = 0; i < this.pens.length; i++) {
        this.pens[i].show();
    }
};

GlassLab.PenManager.prototype.DestroyAllPens = function()
{
    // For now just destroy all sprites on the pen and creature layers.
    for (var i = GLOBAL.penLayer.children.length-1; i>=0; i--) {
        GLOBAL.penLayer.getChildAt(i).destroy();
    }

    this.pens = [];
};