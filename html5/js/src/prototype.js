/**
 * Created by Jerry Fu on 1/9/2015.
 */
var GLOBAL = GLOBAL || {};
window.onload = function() {
    var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update, render: render});
    GLOBAL.game = game;
    GLOBAL.stickyMode = false; // If true, click to grab something or put it down. If false, drag things around.

    function preload() {
        game.load.atlasJSONHash('sheep', 'assets/images/sheepAnim.png', 'assets/images/sheepAnim.json');
        game.load.image('tile', 'assets/images/tile.png');
        game.load.image('penBg', 'assets/images/dirtTile1_top.png');
        game.load.image('penLeftEdge', 'assets/images/edgeFence_vertical.png');
        game.load.image('penRightEdge', 'assets/images/edgeFence_horizontal.png');
        game.load.image('food', 'assets/images/isoCarrot.png');
        /*
        game.load.image('autumnTile1', 'assets/images/autumn_ground1.png');
        game.load.image('autumnTile2', 'assets/images/autumn_ground2.png');
        game.load.image('autumnTile3', 'assets/images/autumn_ground3.png');
        game.load.image('autumnTile4', 'assets/images/autumn_ground4.png');
        game.load.image('autumnTile5', 'assets/images/autumn_water.png');
        game.load.image('autumnTile6', 'assets/images/autumn_fenceBottomCorner.png');
        game.load.image('autumnTile7', 'assets/images/autumn_fenceSideCorner.png');
        game.load.image('autumnTile8', 'assets/images/autumn_fenceStraight.png');
        game.load.image('autumnTile9', 'assets/images/autumn_fenceTopCorner.png');
        */
        game.load.image('grassTile0', 'assets/images/grassy_water.png');
        game.load.image('grassTile1', 'assets/images/grassy_1.png');
        game.load.image('grassTile2', 'assets/images/grassy_2.png');
        game.load.image('grassTile3', 'assets/images/grassy_3.png');
        game.load.image('grassTile4', 'assets/images/grassy_4.png');
        game.load.image('grassTile5', 'assets/images/grassy_fence_bottomCorner.png');
        game.load.image('grassTile6', 'assets/images/grassy_fence_length.png');
        game.load.image('grassTile7', 'assets/images/grassy_fence_sideCorner.png');
        game.load.image('grassTile8', 'assets/images/grassy_fence_topCorner.png');

        // Cloud shadow
        game.load.image('cloudShadow', 'assets/images/cloudShadow.png');

        // UI
        game.load.image('zoomIcons', 'assets/images/zoom-icons-md.png');
        game.load.image('fullscreenIcon', 'assets/images/maximize-128.png');
        game.load.image('pauseIcon', 'assets/images/519697-205_CircledPause-128.png');

        game.plugins.add(new Phaser.Plugin.Isometric(game));
    }

    function create()
    {
        game.stage.disableVisibilityChange = true; // Don't pause when focus is lost

        // Setup bounds for world (used for camera, can also be used to keep entities inside bounds if you want)
        game.world.setBounds(-1000,-1000,2000, 2000);

        // Setup world
        game.iso.anchor.setTo(0,0);
        game.iso.projectionAngle = 0.52359877559829887307710723054658; // 30 degree angle
        game.world.scale.setTo(0.5, 0.5);

        GLOBAL.tileSize = 139; // Art tile size is about 139 (guessed with trial and error)

        game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);

        // Create TileManager and map
        GLOBAL.tileManager = new GlassLab.TileManager(GLOBAL.game);
        GLOBAL.tileManager.GenerateRandomMapData(20, 20);
        GLOBAL.tileManager.SetTileSize(GLOBAL.tileSize);
        GLOBAL.tileManager.SetCenter(10,10);
        GLOBAL.grassGroup = game.add.group();
        GLOBAL.tileManager.GenerateMapFromDataToGroup(GLOBAL.grassGroup);

        // Create pen
        GLOBAL.penLayer = game.add.group();
        GLOBAL.creatureLayer = game.add.group();

      var pen = new GlassLab.FeedingPen(game, GLOBAL.penLayer, 1, 1, 3);

        // Create creatures
        for (var i=0; i < 10; i++)
        {
            var creature = new GlassLab.Creature(game, "sheep");
            GLOBAL.creatureLayer.add(creature.sprite);
            var randX = parseInt(Math.random() * 20);
            var randY = parseInt(Math.random() * 20);
            var targetPosition = GLOBAL.tileManager.GetTileData(randX, randY);
            while (!GLOBAL.tileManager.IsTileTypeWalkable(targetPosition))
            {
                randX = parseInt(Math.random() * 20);
                randY = parseInt(Math.random() * 20);
                targetPosition = GLOBAL.tileManager.GetTileData(randX, randY);
            }

            var pos = GLOBAL.tileManager.GetTileWorldPosition(randX, randY);
            creature.sprite.isoX = pos.x;
            creature.sprite.isoY = pos.y;
            creature.sprite.scale.x = creature.sprite.scale.y = .25;
            if (i%2)
            {
                creature.sprite.scale.x *= -1;
            }

            //creature.sprite.events.onInputDown.add(onDown, this);
            //creature.sprite.events.onInputUp.add(onUp, this);
        }

        // Add clouds
        GLOBAL.cloudManager = new GlassLab.CloudManager(game);
        game.world.add(GLOBAL.cloudManager.renderGroup);

        // Add UI
        var uiGroup = game.add.group();
        var uiElement = game.make.sprite();

        game.input.onDown.add(globalDown, this); // Global input down handler
        game.input.onUp.add(globalUp, this); // Global input down handler

        // Move camera so center of iso world is in middle of screen
        game.camera.x = -game.camera.width/2;

        // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
        GLOBAL.lastMousePosition = new Phaser.Point();

      this.toggleStickyModeKey = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    }

    function globalDown(pointer, DOMevent)
    {
        if (!pointer.targetObject) // if nothing clicked on
        {
        }
    }

  function globalUp(pointer, DOMevent)
  {
    if (GLOBAL.stickyMode && GLOBAL.dragTarget) {
      if (GLOBAL.dragTarget.OnStickyDrop) GLOBAL.dragTarget.OnStickyDrop();
      GLOBAL.dragTarget = null;
      GLOBAL.justDropped = true;
    }
  }

    function update(game)
    {
        GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);

        GLOBAL.justDropped = false;

        // Re-sort creatures because they probably moved
        game.iso.simpleSort(GLOBAL.creatureLayer);

        if (game.input.activePointer.isDown && !GLOBAL.dragTarget)
        {
            game.camera.x -= game.input.activePointer.x - GLOBAL.lastMousePosition.x;
            game.camera.y -= game.input.activePointer.y - GLOBAL.lastMousePosition.y;
        }

        var cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY);
        game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, game.world.scale, cursorIsoPosition);
        var tileSprite = GLOBAL.tileManager.TryGetTileAtWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        if (tileSprite != GLOBAL.highlightedTile)
        {
            if (GLOBAL.highlightedTile) GLOBAL.highlightedTile.tint = 0xFFFFFF;
            if (tileSprite) tileSprite.tint = 0xBFE2F2; //previous color was 0x86bfda (good for night) but I lightened it
            GLOBAL.highlightedTile = tileSprite;
        }

        GLOBAL.lastMousePosition.setTo(game.input.activePointer.x, game.input.activePointer.y); // Always remember last mouse position

        if (this.toggleStickyModeKey && this.toggleStickyModeKey.justDown) {
          GLOBAL.stickyMode = !GLOBAL.stickyMode;
          console.log("Sticky mode:", GLOBAL.stickyMode);
        }
    }

    function render() {
        // Camera debug info
        if (GLOBAL.debug)
        {
            game.debug.cameraInfo(game.camera, 32, 32);
        }
    }
};