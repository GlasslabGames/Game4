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
        game.load.image('penBg', 'assets/images/dirtTile1_top.png');
        game.load.image('penLeftEdge', 'assets/images/edgeFence_vertical.png');
        game.load.image('penRightEdge', 'assets/images/edgeFence_horizontal.png');
        game.load.image('food', 'assets/images/isoCarrot.png');
        game.load.spritesheet('button', 'assets/images/feedButton.png', 188, 71);

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
        game.load.image('zoomBG', 'assets/images/prima_HUD_zoom.png');
        game.load.image('zoomInIcon', 'assets/images/prima_HUD_zoomIn.png');
        game.load.image('zoomOutIcon', 'assets/images/prima_HUD_zoomOut.png');
        game.load.image('fullscreenIcon', 'assets/images/prima_HUD_enterFullScreen.png');
        game.load.image('fullscreenOffIcon', 'assets/images/prima_HUD_exitFullScreen.png');
        game.load.image('itemsIcon', 'assets/images/prima_HUD_items.png');
        game.load.image('journalIcon', 'assets/images/prima_HUD_journal.png');
        game.load.image('ordersIcon', 'assets/images/prima_HUD_orders.png');
        game.load.image('pauseIcon', 'assets/images/prima_HUD_pause.png');
        game.load.image('closeIcon', 'assets/images/Close-button.png');
        game.load.image('alertIcon', 'assets/images/prima_HUD_alertBadge.png');
        game.load.image('skullIcon', 'assets/images/skull-icon.png');
        game.load.image('journalMock', 'assets/images/journal_mock.png');
        game.load.image('orderMock', 'assets/images/order_mock.png');

        game.plugins.add(new Phaser.Plugin.Isometric(game));

        var loadingText = game.add.text(32, 32, "Loading...", { fill: '#ffffff' } );

        game.load.onFileComplete.add(function(progress, cacheKey, success, totalLoaded, totalFiles){
            loadingText.setText("Loading... "+progress+"%");
        }, this);
        game.load.onLoadComplete.add(function() {
            loadingText.destroy();
            loadingText = null;
        }, this);
    }

    function create()
    {
        game.stage.disableVisibilityChange = true; // Don't pause when focus is lost

        // Setup bounds for world (used for camera, can also be used to keep entities inside bounds if you want)
        game.world.setBounds(-1000,-1000,2000, 2000);

        // Setup world
        game.iso.anchor.setTo(0,0);
        game.iso.projectionAngle = 0.52359877559829887307710723054658; // 30 degree angle

        GLOBAL.UILayer = game.add.group();
        GLOBAL.WorldLayer = game.add.group();
        GLOBAL.WorldLayer.scale.setTo(0.5, 0.5);

        GLOBAL.tileSize = 138; // Art tile size is about 139 (guessed with trial and error)

        game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);

        GLOBAL.creatureManager = new GlassLab.CreatureManager(GLOBAL.game);

        GLOBAL.levelManager = new GlassLab.LevelManager(GLOBAL.game);
        GLOBAL.levelManager.LoadNextLevel(); // Load first level

        // Create TileManager and map
        GLOBAL.tileManager = new GlassLab.TileManager(GLOBAL.game);
        GLOBAL.tileManager.GenerateRandomMapData(20, 20);
        GLOBAL.tileManager.SetTileSize(GLOBAL.tileSize);
        GLOBAL.tileManager.SetCenter(10,10);
        GLOBAL.grassGroup = game.make.group();
        GLOBAL.tileManager.GenerateMapFromDataToGroup(GLOBAL.grassGroup);
        GLOBAL.WorldLayer.add(GLOBAL.grassGroup);

        // Create pen
        GLOBAL.penLayer = game.make.group();
        GLOBAL.WorldLayer.add(GLOBAL.penLayer);
        GLOBAL.creatureLayer = game.make.group();
        GLOBAL.WorldLayer.add(GLOBAL.creatureLayer);

        GLOBAL.paused = false;

        var pen = new GlassLab.FeedingPen(game, GLOBAL.penLayer, 1, 1, 3);

        // Create creatures
        for (var i=0; i < 0; i++)
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
        GLOBAL.WorldLayer.add(GLOBAL.cloudManager.renderGroup);

        // Add UI
        // TODO: Gross, so much crap here. How to clean?
        GLOBAL.UIManager = new GlassLab.UIManager(GLOBAL.game);

        var uiGroup = game.add.group();
        GLOBAL.UIGroup = uiGroup;

        // Anchors
        var centerAnchor = game.make.sprite(game.camera.width/2, game.camera.height/2);
        centerAnchor.anchor.setTo(.5, .5);
        centerAnchor.fixedToCamera = true;
        game.scale.onSizeChange.add(function(){ // Add listener to reposition whenever screen scale is changed.
            this.cameraOffset.x = game.camera.width/2;
            this.cameraOffset.y = game.camera.height/2;
        }, centerAnchor);
        uiGroup.add(centerAnchor);

        var topRightAnchor = game.make.sprite(game.camera.width, 0);
        topRightAnchor.anchor.setTo(1, 0);
        topRightAnchor.fixedToCamera = true;
        game.scale.onSizeChange.add(function(){ // Add listener to reposition whenever screen scale is changed.
            this.cameraOffset.x = game.camera.width;
        }, topRightAnchor);
        uiGroup.add(topRightAnchor);

        var table = new GlassLab.UITable(game, 1, 20);
        table.x = table.y = 30;
        uiGroup.add(table);
        table.fixedToCamera = true;

        // pause icon
        uiElement = game.make.sprite(0, 0, "pauseIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){ GLOBAL.paused = !GLOBAL.paused; }, this);
        table.addManagedChild(uiElement);

        var zoomBG = game.make.sprite(0, 0, "zoomBG");
        table.addManagedChild(zoomBG);
        var uiElement = game.make.sprite(15, 40, "zoomInIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            GLOBAL.WorldLayer.scale.x *= 2;GLOBAL.WorldLayer.scale.y *= 2;
        }, this);
        zoomBG.addChild(uiElement);
        uiElement = game.make.sprite(15, 110, "zoomOutIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            GLOBAL.WorldLayer.scale.x /= 2;GLOBAL.WorldLayer.scale.y /= 2;
        }, this);
        zoomBG.addChild(uiElement);

        var fullscreenUIElement = game.make.sprite(0, 0, "fullscreenIcon");
        fullscreenUIElement.inputEnabled = true;
        fullscreenUIElement.events.onInputDown.add(function(){
            if (game.scale.isFullScreen)
            {
                game.scale.stopFullScreen();
                var texture = game.cache.getRenderTexture("fullscreenIcon");
                fullscreenUIElement.loadTexture("fullscreenIcon");
            }
            else
            {
                game.scale.startFullScreen(false);
                var texture = game.cache.getRenderTexture("fullscreenOffIcon");
                fullscreenUIElement.loadTexture("fullscreenOffIcon");
            }
        }, this);
        table.addManagedChild(fullscreenUIElement);
        table._refresh();

        table = new GlassLab.UITable(game, 1, 40);
        table.x = -130;
        table.y = 30;
        topRightAnchor.addChild(table);

        uiElement = game.make.sprite(0,0, "ordersIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            if (!GLOBAL.Orders.IsShowing())
            {
                GLOBAL.Orders.Show();
            }
            else
            {
                GLOBAL.Orders.Hide();
            }
        }, this);
        table.addManagedChild(uiElement);

        uiElement = game.make.sprite(0,0, "journalIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            if (!GLOBAL.Journal.IsShowing())
            {
                GLOBAL.Journal.Show();
            }
            else
            {
                GLOBAL.Journal.Hide();
            }
        }, this);
        table.addManagedChild(uiElement);
        table._refresh();

        var bottomRightAnchor = game.make.sprite(game.camera.width, game.camera.height);
        bottomRightAnchor.anchor.setTo(1, 1);
        bottomRightAnchor.fixedToCamera = true;
        game.scale.onSizeChange.add(function(){ // Add listener to reposition whenever screen scale is changed.
            this.cameraOffset.x = game.camera.width;
            this.cameraOffset.y = game.camera.height;
        }, bottomRightAnchor);
        uiGroup.add(bottomRightAnchor);

        uiElement = game.make.sprite(-130, -130, "itemsIcon");
        bottomRightAnchor.addChild(uiElement);

        uiElement = game.make.sprite(-230, -100, "skullIcon");
        uiElement.scale.setTo(.25, .25);
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            GLOBAL.FailModal.Show();
        }, this);
        bottomRightAnchor.addChild(uiElement);

        game.input.onDown.add(globalDown, this); // Global input down handler
        game.input.onUp.add(globalUp, this); // Global input down handler

        // Move camera so center of iso world is in middle of screen
        game.camera.x = -game.camera.width/2;

        // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
        GLOBAL.lastMousePosition = new Phaser.Point();

        game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
        game.scale.enterFullScreen.add(onEnterFullScreen, this);
        game.scale.leaveFullScreen.add(onLeaveFullScreen, this);

        this.toggleStickyModeKey = game.input.keyboard.addKey(Phaser.Keyboard.ONE);

        var failModal = new GlassLab.FailModal(game);
        failModal.sprite.x = -200
        failModal.sprite.y = -150;
        centerAnchor.addChild(failModal.sprite);
        GLOBAL.FailModal = failModal;

        var journal = new GlassLab.Journal(game);
        journal.sprite.x = -400
        journal.sprite.y = -300;
        centerAnchor.addChild(journal.sprite);
        GLOBAL.Journal = journal;

        var orders = new GlassLab.OrdersMenu(game);
        orders.sprite.x = -400
        orders.sprite.y = -300;
        centerAnchor.addChild(orders.sprite);
        GLOBAL.Orders = orders;
    }

    function onEnterFullScreen() {
    }

    function onLeaveFullScreen() {
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
        if (!GLOBAL.paused)
        {
            GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);
        }

        GLOBAL.justDropped = false;

        var tileSprite;

        // Re-sort creatures because they probably moved
        game.iso.simpleSort(GLOBAL.creatureLayer);

        if (game.input.activePointer.isDown && !GLOBAL.dragTarget)
        {
            game.camera.x -= game.input.activePointer.x - GLOBAL.lastMousePosition.x;
            game.camera.y -= game.input.activePointer.y - GLOBAL.lastMousePosition.y;
        }
        else if (!game.input.activePointer.targetObject || game.input.activePointer.targetObject.sprite == GLOBAL.dragTarget)
        {
            cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY);
            game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
            Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
            tileSprite = GLOBAL.tileManager.TryGetTileAtWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        }

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
