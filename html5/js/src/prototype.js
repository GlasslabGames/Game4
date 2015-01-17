/**
 * Created by Jerry Fu on 1/9/2015.
 */
var GLOBAL = GLOBAL || {};
window.onload = function() {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update, render: render});
    GLOBAL.game = game;

    function preload() {
        game.load.atlasJSONHash('sheep', 'assets/images/sheepAnim.png', 'assets/images/sheepAnim.json');
        game.load.image('tile', 'assets/images/tile.png');
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
        GLOBAL.tileManager.SetCenter(9,9);
        GLOBAL.grassGroup = game.add.group();
        GLOBAL.tileManager.GenerateMapFromDataToGroup(GLOBAL.grassGroup);

        // Create creatures
        GLOBAL.creatureLayer = game.add.group();
        for (var i=0; i < 50; i++)
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

            creature.sprite.events.onInputDown.add(onDown, this);
            creature.sprite.events.onInputUp.add(onUp, this);
        }

        game.input.onDown.add(globalDown, this); // Global input down handler

        // Move camera so center of iso world is in middle of screen
        game.camera.x = -game.camera.width/2;

        // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
        GLOBAL.lastMousePosition = new Phaser.Point();
    }

    function onDown(sprite, pointer)
    {
        GLOBAL.dragTarget = sprite;
    }
    function onUp(sprite, pointer)
    {
        GLOBAL.dragTarget = null;
    }

    function globalDown(pointer, DOMevent)
    {
        if (!pointer.targetObject) // if nothing clicked on
        {
        }
    }

    function update(game)
    {
        GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);

        // Re-sort creatures because they probably moved
        game.iso.simpleSort(GLOBAL.creatureLayer);

        var cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY+50);
        game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, game.world.scale, cursorIsoPosition);
        // If we have a drag target, move it
        if (GLOBAL.dragTarget)
        {
            game.world.bringToTop(GLOBAL.dragTarget);

            if (GLOBAL.dragTarget.body)
            {
                GLOBAL.dragTarget.body.position.x = cursorIsoPosition.x;
                GLOBAL.dragTarget.body.position.y = cursorIsoPosition.y;
            }
            else
            {
                GLOBAL.dragTarget.isoX = cursorIsoPosition.x;
                GLOBAL.dragTarget.isoY = cursorIsoPosition.y;
            }
        }
        // else drag the camera
        else if (game.input.activePointer.isDown)
        {
            game.camera.x -= game.input.activePointer.x - GLOBAL.lastMousePosition.x;
            game.camera.y -= game.input.activePointer.y - GLOBAL.lastMousePosition.y;
        }

        cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY+50);
        game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
        Phaser.Point.divide(cursorIsoPosition, game.world.scale, cursorIsoPosition);
        var tileSprite = GLOBAL.tileManager.TryGetTileAtWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        if (tileSprite != GLOBAL.highlightedTile)
        {
            if (GLOBAL.highlightedTile) GLOBAL.highlightedTile.tint = 0xFFFFFF;
            if (tileSprite) tileSprite.tint = 0x86bfda;
            GLOBAL.highlightedTile = tileSprite;
        }

        GLOBAL.lastMousePosition.setTo(game.input.activePointer.x, game.input.activePointer.y); // Always remember last mouse position
    }

    function render() {
        // Camera debug info
        if (GLOBAL.debug)
        {
            game.debug.cameraInfo(game.camera, 32, 32);
        }
    }
};