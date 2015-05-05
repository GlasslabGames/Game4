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

    // We used to take custom row and cols, but we don't any more.
    //col = col || penData.startCol;
    //row = row || penData.startRow;
    this._centerPen(pen); // automatically center the pen

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
        right_moveable: pen.rightmostEdge.draggable, // even if there are multiple right edges, we can just check one
        bottom_moveable: pen.bottomEdge.draggable
    });

    return pen;
};

GlassLab.PenManager.prototype._centerPen = function(pen) {

    var type = pen.type || pen.creatureType;
    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(type);
    if (creatureInfo) {
        var totalFood = 0;
        for (var i = 0; i < creatureInfo.desiredFood.length; i++) {
            totalFood += creatureInfo.desiredFood[i].amount;
        }
        var ratio = 1 / (1 + totalFood);
        var left = GLOBAL.penAreaWidth * ratio;
        var col = Math.round(left - GLOBAL.penAreaWidth / 2) - pen.widths[0];
        col -= 1;
        pen.sprite.isoX = col * GLOBAL.tileSize;
    }

    var row = -Math.floor(pen.height / 2);
    row -= 1;
    pen.sprite.isoY = row * GLOBAL.tileSize;

    pen.Resize();
};

GlassLab.PenManager.prototype.zoomToPen = function(pen) {
    if (!pen) pen = this.pens[0];
    if (!pen) {
        console.error("Called PenManager.zoomToPen without a pen to focus on!");
        return;
    }

    /*var isoPos = pen.sprite.isoPosition;
    //isoPos.x += pen.getFullWidth() / 2;
    //isoPos.y += pen.height / 2;
    var pos = this.game.iso.project(isoPos);
    pos = Phaser.Point.multiply(pos, GLOBAL.worldLayer.scale);
    console.log(isoPos.x, isoPos.y, pos.x, pos.y);

    this.game.camera.x = pos.x*//* - this.game.camera.width * 0.5;*//*
    this.game.camera.y = pos.y*//* - this.game.camera.height * 0.5;*/

    // TODO!!

    var xOffset = 0; //-75;
    var yOffset = 0; //100;
    this.game.camera.x = -this.game.camera.width * 0.5 + xOffset;
    this.game.camera.y = -this.game.camera.height * 0.5 + yOffset;

    var maxDimension = Math.max(pen.getFullWidth(), pen.height);
    GLOBAL.UIManager.zoomTo(0);
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
    for (var i = 0; i < this.pens.length; i++) {
        if (this.pens[i]) this.pens[i].sprite.destroy();
    }

    this.pens = [];
};