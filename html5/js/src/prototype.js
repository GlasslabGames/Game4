/**
 * Created by Jerry Fu on 1/9/2015.
 */
var GLOBAL = GLOBAL || {};

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

window.onload = function() {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update, render: render});
    GLOBAL.game = game;
    GLOBAL.version = "0.2.1";
    GLOBAL.stickyMode = (getParameterByName("sticky") == "true"); // If true, click to grab something or put it down. If false, drag things around.
    GLOBAL.UIpriorityID = 100; // set the input.priorityID on all UI elements to this so they'll be above the game elements

    function preload() {
        var creatureSpriteNames = ["sheep", "unicorn", "babySheep", "babyUnicorn"];
        for (var i = 0; i < creatureSpriteNames.length; i++) {
            var spriteName = creatureSpriteNames[i];
            game.load.image(spriteName+'_idle', 'assets/images/creatures/'+spriteName+'_idle.png');
            game.load.image(spriteName+'_idle_back', 'assets/images/creatures/'+spriteName+'_backfacing_idle.png');
            game.load.atlasJSONHash(spriteName+'_walk', 'assets/images/creatures/'+spriteName+'_walk.png', 'assets/images/creatures/'+spriteName+'_walk.json');
            game.load.atlasJSONHash(spriteName+'_walk_back', 'assets/images/creatures/'+spriteName+'_backfacing_walk.png', 'assets/images/creatures/'+spriteName+'_backfacing_walk.json');
            game.load.atlasJSONHash(spriteName+'_eat', 'assets/images/creatures/'+spriteName+'_eat.png', 'assets/images/creatures/'+spriteName+'_eat.json');
            game.load.atlasJSONHash(spriteName+'_vomit', 'assets/images/creatures/'+spriteName+'_vomit.png', 'assets/images/creatures/'+spriteName+'_vomit.json');
            game.load.image(spriteName+'_art', 'assets/images/creatures/'+spriteName+'_art.png');
        }


        var foodSpriteNames = ["carrot", "apple", "strawberry", "tincan", "broccoli"];
        for (var i = 0; i < foodSpriteNames.length; i++) {
            spriteName = foodSpriteNames[i];
            game.load.image(spriteName, 'assets/images/food/'+spriteName+'.png');
            game.load.atlasJSONHash(spriteName+'_eaten', 'assets/images/food/'+spriteName+'_death_vfx.png', 'assets/images/food/'+spriteName+'_death_vfx.json');
            game.load.atlasJSONHash(spriteName+'_eaten_long', 'assets/images/food/'+spriteName+'_long_death_vfx.png', 'assets/images/food/'+spriteName+'_long_death_vfx.json');
        }

        game.load.image('shadow', 'assets/images/iso_shadow.png');
        game.load.atlasJSONHash('vomit', 'assets/images/vomit_vfx.png', 'assets/images/vomit_vfx.json');

        game.load.image('penBg', 'assets/images/tiles/dirtTile1_top.png');
        game.load.image('penLeftEdge', 'assets/images/edgeFence_vertical2.png');
        game.load.image('penRightEdge', 'assets/images/edgeFence_horizontal2.png');
        game.load.spritesheet('button', 'assets/images/feedButton.png', 188, 71);
        game.load.image('happyEmote', 'assets/images/happyEmote.png');
        game.load.image('angryEmote', 'assets/images/angryEmote.png');

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
        game.load.image('grassTile0', 'assets/images/tiles/grassy_water.png');
        game.load.image('grassTile1', 'assets/images/tiles/grassy_1.png');
        game.load.image('grassTile2', 'assets/images/tiles/grassy_2.png');
        game.load.image('grassTile3', 'assets/images/tiles/grassy_3.png');
        game.load.image('grassTile4', 'assets/images/tiles/grassy_4.png');
        /*game.load.image('grassTile5', 'assets/images/grassy_fence_bottomCorner.png');
        game.load.image('grassTile6', 'assets/images/grassy_fence_length.png');
        game.load.image('grassTile7', 'assets/images/grassy_fence_sideCorner.png');
        game.load.image('grassTile8', 'assets/images/grassy_fence_topCorner.png');*/
        game.load.image('dirtTile', 'assets/images/tiles/dirtTile1.png');

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
        game.load.image('pauseIcon', 'assets/images/prima_HUD_pause.png');
        game.load.image('closeIcon', 'assets/images/Close-button.png');
        game.load.image('alertIcon', 'assets/images/prima_HUD_alertBadge.png');
        game.load.image('journalBg', 'assets/images/journal_bg.png');
        game.load.image('cancelButton', 'assets/images/cancel_button.png');
        game.load.image('selectOrderButton', 'assets/images/selectOrderButton.png');
        game.load.image('nextLevelButton', 'assets/images/nextLevelButton.png');
        game.load.image('sideArrow', 'assets/images/sideArrow.png');
        game.load.image('lock', 'assets/images/HUD_items_lock.png');
        game.load.image('dashedCircle', 'assets/images/dashedCircle.png');
        game.load.image('penArrowDown', 'assets/images/penArrow_downward.png');
        game.load.image('penArrowUp', 'assets/images/penArrow_upward.png');

        game.load.image('assistant', 'assets/images/assistant.png');
        game.load.image('speech_bubble', 'assets/images/speech_bubble1.png');

        game.load.image('bigO', 'assets/images/matchingGame_o.png');
        game.load.image('bigX', 'assets/images/matchingGame_x.png');

        game.load.json('vs_quest', 'assets/quests/vertical_slice.json');
        game.load.json('alpha_quest', 'assets/quests/alpha.json');
        game.load.json('alpha1', 'assets/quests/alpha1.json');
        game.load.json('alpha2', 'assets/quests/alpha2.json');
        game.load.json('alpha3', 'assets/quests/alpha3.json');
        game.load.json('alpha4', 'assets/quests/alpha.json');

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

        // Save Manager
        GLOBAL.saveManager = new GlassLab.SaveManager(game);

        GLOBAL.creatureManager = new GlassLab.CreatureManager(GLOBAL.game);
        GLOBAL.penManager = new GlassLab.PenManager(GLOBAL.game);

        GLOBAL.inventoryManager = new GlassLab.InventoryManager(GLOBAL.game);

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

        GLOBAL.foodLayer = game.make.group();
        GLOBAL.WorldLayer.add(GLOBAL.foodLayer);

        GLOBAL.creatureLayer = game.make.group();
        GLOBAL.WorldLayer.add(GLOBAL.creatureLayer);

        GLOBAL.effectLayer = game.make.group();
        GLOBAL.WorldLayer.add(GLOBAL.effectLayer);

        GLOBAL.paused = false;

        // Add clouds
        GLOBAL.cloudManager = new GlassLab.CloudManager(game);
        GLOBAL.WorldLayer.add(GLOBAL.cloudManager.renderGroup);

        // Add UI
        // TODO: Gross, so much crap here. How to clean? We could move into UIManager at least..
        var uiGroup = game.add.group();
        GLOBAL.UIGroup = uiGroup;

        GLOBAL.UIManager = new GlassLab.UIManager(GLOBAL.game);

        GLOBAL.telemetryManager = new GlassLab.TelemetryManager();

        var table = new GlassLab.UITable(game, 1, 20);
        table.x = -70;
        table.y = 20;
        GLOBAL.UIManager.topRightAnchor.addChild(table);

        // pause icon
        var uiElement = new GlassLab.UIElement(game, 0, 0, "pauseIcon");
        uiElement.scale.setTo(.5, .5);
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){ GLOBAL.paused = !GLOBAL.paused; }, this);
        table.addManagedChild(uiElement);

        var zoomBG = new GlassLab.UIElement(game, 0, 0, "zoomBG");
        zoomBG.scale.setTo(.5, .5);
        table.addManagedChild(zoomBG);
        uiElement = new GlassLab.UIElement(game, 15, 40, "zoomInIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            GLOBAL.WorldLayer.scale.x *= 2;
            GLOBAL.WorldLayer.scale.y *= 2;
        }, this);
        zoomBG.addChild(uiElement);
        uiElement = new GlassLab.UIElement(game, 15, 110, "zoomOutIcon");
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            GLOBAL.WorldLayer.scale.x /= 2;
            GLOBAL.WorldLayer.scale.y /= 2;
        }, this);
        zoomBG.addChild(uiElement);

        var fullscreenUIElement = new GlassLab.UIElement(game, 0, 0, "fullscreenIcon");
        fullscreenUIElement.scale.setTo(.5, .5);
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
        table.x = 20;
        table.y = 20;
        GLOBAL.UIManager.topLeftAnchor.addChild(table);

        uiElement = new GlassLab.UIElement(game, 0,0, "journalIcon");
        uiElement.scale.setTo(.6, .6);
        uiElement.inputEnabled = true;
        var journalAlert = game.make.sprite(0,0,"alertIcon");
        journalAlert.anchor.setTo(.5,.5);
        journalAlert.visible = false;
        GlassLab.SignalManager.levelWon.add(function(level){ this.visible = true; }, journalAlert);
        uiElement.addChild(journalAlert);
        uiElement.events.onInputDown.add(function(){
            if (!GLOBAL.Journal.IsShowing())
            {
                journalAlert.visible = false;
                GLOBAL.Journal.Show();
            }
            else
            {
                GLOBAL.Journal.Hide();
            }
        }, this);
        table.addManagedChild(uiElement);

        uiElement = new GlassLab.UIButton(game, 0,0, function(){
            if (!GLOBAL.mailManager.IsMailShowing())
            {
                ordersAlert.visible = false;
                GLOBAL.mailManager.ShowMail();
            }
            else
            {
                GLOBAL.mailManager.HideMail();
            }
        }, this, 60, 60, 0xffffff, "Mail", 16);
        uiElement.inputEnabled = true;
        GLOBAL.ordersButton = uiElement;
        var ordersAlert = game.make.sprite(0,0,"alertIcon");
        ordersAlert.anchor.setTo(.5,.5);
        ordersAlert.scale.setTo(.6, .6);
        uiElement.addChild(ordersAlert);
        GlassLab.SignalManager.levelLoaded.add(function(level){
            this.visible = (level.data.orders && level.data.orders.length > 0);
        }, uiElement);
        GlassLab.SignalManager.orderAdded.add(function(order){
            this.visible = true;
            ordersAlert.visible = true;
        }, uiElement);
        table.addManagedChild(uiElement, true);

        uiElement = new GlassLab.UIElement(game, 20, -100, "itemsIcon");
        uiElement.scale.setTo(.6, .6);
        uiElement.inputEnabled = true;
        uiElement.events.onInputDown.add(function(){
            if (!GLOBAL.inventoryMenu.visible)
            {
                GLOBAL.inventoryMenu.Show();
                if (GLOBAL.assistant) GLOBAL.assistant.sprite.y = -200;
            }
            else
            {
                GLOBAL.inventoryMenu.Hide();
                if (GLOBAL.assistant) GLOBAL.assistant.sprite.y = -100;
            }
        }, this);
        GLOBAL.UIManager.bottomLeftAnchor.addChild(uiElement);
        uiElement.visible = getParameterByName("items") != "false"; // default to using items

        // Move camera so center of iso world is in middle of screen
        game.camera.x = -game.camera.width/2;
        game.camera.y = -game.camera.height/2;

      // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
        GLOBAL.lastMousePosition = new Phaser.Point();

        game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
        game.scale.enterFullScreen.add(onEnterFullScreen, this);
        game.scale.leaveFullScreen.add(onLeaveFullScreen, this);

        var journal = new GlassLab.Journal(game);
        journal.sprite.x = -300;
        journal.sprite.y = -270;
        journal.sprite.scale.setTo(.6, .6);
        GLOBAL.UIManager.centerAnchor.addChild(journal.sprite);
        GLOBAL.Journal = journal;

        GLOBAL.mailManager = new GlassLab.MailManager(game);

        var orderFulfillment = new GlassLab.OrderFulfillment(game);
        orderFulfillment.sprite.scale.setTo(.6, .6);
        orderFulfillment.sprite.x = 20;
        orderFulfillment.sprite.y = -380; // or 250 if the inventory is closed?
        GLOBAL.UIManager.bottomLeftAnchor.addChild(orderFulfillment.sprite);
        GLOBAL.orderFulfillment = orderFulfillment;

        var inventoryMenu = new GlassLab.InventoryMenu(game);
        inventoryMenu.scale.setTo(0.7, 0.7);
        inventoryMenu.x = -700;
        inventoryMenu.y = -120;
        GLOBAL.UIManager.bottomRightAnchor.addChild(inventoryMenu);
        GLOBAL.inventoryMenu = inventoryMenu;

        var assistant = new GlassLab.Assistant(game);
        assistant.sprite.x = -80;
        assistant.sprite.y = -200;
        GLOBAL.UIManager.bottomRightAnchor.addChild(assistant.sprite);
        GLOBAL.assistant = assistant;

        var versionLabel = game.make.text(0,0,"v"+GLOBAL.version, {font: "8pt Arial", fill:'#ffffff'});
        versionLabel.fixedToCamera = true;
        GLOBAL.UIGroup.add(versionLabel);

        GLOBAL.sortingGame = new GlassLab.SortingGame(game);
        GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.sortingGame);
        //GLOBAL.sortingGame.x = -GLOBAL.sortingGame.width / 2;
        GLOBAL.sortingGame.y = -GLOBAL.sortingGame.height / 2;

        GLOBAL.levelManager = new GlassLab.LevelManager(GLOBAL.game);

        GLOBAL.questManager = new GlassLab.QuestManager(GLOBAL.game);

        GLOBAL.dayManager = new GlassLab.DayManager(GLOBAL.game);

        // FINALLY, load the first level. We do it at the end so that we're sure everything relevant has already been created
        GLOBAL.levelManager.LoadNextLevel(); // Load first level

        game.time.events.start();
    }

    function onEnterFullScreen() {
    }

    function onLeaveFullScreen() {
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

        if (game.input.activePointer.isDown && !GLOBAL.dragTarget && !game.input.activePointer.targetObject)
        {
            game.camera.x -= game.input.activePointer.x - GLOBAL.lastMousePosition.x;
            game.camera.y -= game.input.activePointer.y - GLOBAL.lastMousePosition.y;
        }
        else //if (!game.input.activePointer.targetObject || game.input.activePointer.targetObject.sprite == GLOBAL.dragTarget)
        {
            cursorIsoPosition = new Phaser.Point(game.input.activePointer.worldX,game.input.activePointer.worldY);
            game.iso.unproject(cursorIsoPosition, cursorIsoPosition);
            Phaser.Point.divide(cursorIsoPosition, GLOBAL.WorldLayer.scale, cursorIsoPosition);
            tileSprite = GLOBAL.tileManager.TryGetTileAtIsoWorldPosition(cursorIsoPosition.x, cursorIsoPosition.y);
        }

        if (tileSprite != GLOBAL.highlightedTile)
        {
            if (GLOBAL.highlightedTile) GLOBAL.highlightedTile.tint = 0xFFFFFF;
            if (tileSprite) tileSprite.tint = 0xBFE2F2; //previous color was 0x86bfda (good for night) but I lightened it
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
