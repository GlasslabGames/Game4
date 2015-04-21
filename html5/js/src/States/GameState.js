/**
 * Created by Jerry Fu on 2/27/2015.
 */

var GlassLab = GlassLab || {};
GlassLab.State = GlassLab.State || {};

GlassLab.State.Game = function(game) {};

GlassLab.State.Game.prototype.preload = function()
{

};
GlassLab.State.Game.prototype.create = function()
{
    var game = this.game;

    GLOBAL.gameInitialized = true;
    GlassLab.SignalManager.gameInitialized.dispatch(); // triggers managers grabbing stuff from the save blob, etc

    GLOBAL.levelManager.LoadFirstLevel(); // Load first level

    game.time.events.start();

    // Move camera so center of iso world is in middle of screen
    game.camera.x = -game.camera.width/2;
    game.camera.y = -game.camera.height/2;

    // start with the sound effects off during development.
    GLOBAL.audioManager.toggleMusic(GlassLab.Util.HasCookieData("musicOn") ? GlassLab.Util.GetCookieData("musicOn") == 'true' : true);
    GLOBAL.audioManager.toggleSoundEffects(GlassLab.Util.HasCookieData("sfxOn") ? GlassLab.Util.GetCookieData("sfxOn") == 'true' : true);
    
    GLOBAL.UILayer.visible = GLOBAL.WorldLayer.visible = true;

    /*var crate = new GlassLab.ShippingPen(this.game);
    crate.setContents("baby_unifox", 2, ["strawberry"], [8], 2, false, false);
    GLOBAL.crate = crate;*/
    //SetContents = function(creatureType, numCreatures, foodTypes, numFoods, targetCreatureWidth, hideCreatures, singleFoodRow)

    GLOBAL.transition.out();

    GLOBAL.mailManager.rewardsPopup.show({
        client: "Archibold Huxley III",
        company: "Rupture Farms",
        totalNumFood: 15,
        noFoodEntries: true,
        creatureType: "bird",
        description: "Dear Friend! My island has 7 RAMS. I have heard you know HOW MANY CARROTS I need FOR EACH. Send me the correct NUMBER OF CARROTS, would you? I will pay you well!",
        fulfilled: false,
        hint: true,
        reward: 200,
        outcome: "satisfied"
    });
};

GlassLab.State.Game.prototype.update = function()
{
    var game = this.game;

    if (!GLOBAL.paused)
    {
        GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);
    }

    var tileSprite;

    // Re-sort creatures because they probably moved
    game.iso.simpleSort(GLOBAL.creatureLayer);

    if (game.input.activePointer.isDown && !GLOBAL.dragTarget && !game.input.activePointer.targetObject && !GLOBAL.mailManager.currentOrder)
    {
        game.camera.x -= game.input.activePointer.x - GLOBAL.lastMousePosition.x;
        game.camera.y -= game.input.activePointer.y - GLOBAL.lastMousePosition.y;
    }
    else //if (!game.input.activePointer.targetObject || game.input.activePointer.targetObject.sprite == GLOBAL.dragTarget)
    {
        var cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY);
        game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
        tileSprite = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
    }

    if (tileSprite != GLOBAL.highlightedTile)
    {
        // Entered tile in pen
        if (tileSprite && tileSprite.inPen && (!GLOBAL.highlightedTile || (GLOBAL.highlightedTile.inPen != tileSprite.inPen)) &&
            tileSprite.inPen instanceof GlassLab.FeedingPen)
        {
            GLOBAL.UIManager.penTooltip.show(tileSprite.inPen);
        }
        else if (GLOBAL.highlightedTile && GLOBAL.highlightedTile.inPen && (!tileSprite || !tileSprite.inPen)) // exited tile in pen
        {
            GLOBAL.UIManager.penTooltip.hide();
        }

        /*
        // Highlight tile
        if (GLOBAL.highlightedTile) GLOBAL.highlightedTile.tint = 0xFFFFFF;
        if (tileSprite) tileSprite.tint = 0xBFE2F2; //previous color was 0x86bfda (good for night) but I lightened it
        */

        GLOBAL.highlightedTile = tileSprite;
    }

    GLOBAL.lastMousePosition.setTo(game.input.activePointer.x, game.input.activePointer.y); // Always remember last mouse position
};

GlassLab.State.Game.prototype.render = function(game)
{
}