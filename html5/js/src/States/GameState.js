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
};

GlassLab.State.Game.prototype.update = function()
{
    var game = this.game;

    if (!GLOBAL.paused)
    {
        GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);
    }

    GLOBAL.justDropped = false;

    var tileSprite;

    // Re-sort creatures because they probably moved
    game.iso.simpleSort(GLOBAL.creatureLayer);

    if (game.input.activePointer.isDown && !GLOBAL.dragTarget && !game.input.activePointer.targetObject)
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
        if (tileSprite && tileSprite.inPen && (!GLOBAL.highlightedTile || (GLOBAL.highlightedTile.inPen != tileSprite.inPen)))
        {
            GLOBAL.UIManager.penTooltip.Show(tileSprite.inPen);
        }
        else if (GLOBAL.highlightedTile && GLOBAL.highlightedTile.inPen && (!tileSprite || !tileSprite.inPen)) // exited tile in pen
        {
            GLOBAL.UIManager.penTooltip.Hide();
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