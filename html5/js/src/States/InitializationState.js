/**
 * Created by Jerry Fu on 2/27/2015.
 */

var GlassLab = GlassLab || {};
GlassLab.State = GlassLab.State || {};

GlassLab.State.Init = function(game) {};

GlassLab.State.Init.prototype.preload = function()
{
    var game = this.game;

    game.stage.disableVisibilityChange = true; // Don't pause when focus is lost
    if (game.paused)
    {
        console.warn("Game was paused during preload. Since this is likely undesired, unpausing...");
        game.paused = false;
    }

    var creatureSpriteNames = ["sheep", "unicorn", "babySheep", "babyUnicorn"];
    for (var i = 0; i < creatureSpriteNames.length; i++) {
        var spriteName = creatureSpriteNames[i];
        game.load.image(spriteName+'_idle', 'assets/images/creatures/'+spriteName+'_idle.png');
        game.load.image(spriteName+'_idle_back', 'assets/images/creatures/'+spriteName+'_backfacing_idle.png');
        game.load.atlasJSONHash(spriteName+'_walk', 'assets/images/creatures/'+spriteName+'_walk.png', 'assets/images/creatures/'+spriteName+'_walk.json');
        game.load.atlasJSONHash(spriteName+'_walk_back', 'assets/images/creatures/'+spriteName+'_backfacing_walk.png', 'assets/images/creatures/'+spriteName+'_backfacing_walk.json');
        game.load.atlasJSONHash(spriteName+'_eat', 'assets/images/creatures/'+spriteName+'_eat.png', 'assets/images/creatures/'+spriteName+'_eat.json');
        game.load.atlasJSONHash(spriteName+'_vomit', 'assets/images/creatures/'+spriteName+'_vomit.png', 'assets/images/creatures/'+spriteName+'_vomit.json');
        game.load.image(spriteName+'_art', 'assets/images/creatures/portrait_'+spriteName+'.png');
        game.load.image(spriteName+'_art_white', 'assets/images/creatures/portrait_'+spriteName+'_white.png');
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
    game.load.image('penLeftEdge', 'assets/images/edgeFence_vertical2.png');
    game.load.image('penRightEdge', 'assets/images/edgeFence_horizontal2.png');

    game.load.image('crateBackCorner', 'assets/images/crate/crate_back_corner.png');
    game.load.image('crateBackLeft', 'assets/images/crate/crate_back_left.png');
    game.load.image('crateBackRight', 'assets/images/crate/crate_back_right.png');
    game.load.image('crateBackRightWindow', 'assets/images/crate/crate_back_right_window.png');
    game.load.image('crateFrontLeft', 'assets/images/crate/crate_front_left.png');
    game.load.image('crateFrontRight', 'assets/images/crate/crate_front_right.png');
    game.load.image('crateFloor', 'assets/images/crate/crate_floor.png');

    game.load.image('penFenceLeft', 'assets/images/pen/feeding_fence_down_left.png');
    game.load.image('penFenceRight', 'assets/images/pen/feeding_fence_down_right.png');
    game.load.image('dottedLineLeft', 'assets/images/pen/dotted_line_left.png');
    game.load.image('dottedLineRight', 'assets/images/pen/dotted_line_right.png');

    game.load.atlasJSONHash('gateDown', 'assets/images/pen/feeding_gate_down.png', 'assets/images/pen/feeding_gate_down.json');
    game.load.atlasJSONHash('gateUp', 'assets/images/pen/feeding_gate_up.png', 'assets/images/pen/feeding_gate_up.json');
    game.load.image('gateCapNear', 'assets/images/pen/feeding_gate_endcap_near.png');
    game.load.image('gateCapFar', 'assets/images/pen/feeding_gate_endcap_far.png');
    game.load.image('gateSwitchBack', 'assets/images/pen/gate_switch_back.png');
    game.load.atlasJSONHash('gateSwitchFlip', 'assets/images/pen/switch_flip.png', 'assets/images/pen/switch_flip.json');
    game.load.atlasJSONHash('gateSwitchFail', 'assets/images/pen/switch_fail.png', 'assets/images/pen/switch_fail.json');
    game.load.atlasJSONHash('gateLightGreen', 'assets/images/pen/switch_light_green.png', 'assets/images/pen/switch_light_green.json');
    game.load.atlasJSONHash('gateLightRed', 'assets/images/pen/switch_light_red.png', 'assets/images/pen/switch_light_red.json');

    game.load.spritesheet('button', 'assets/images/feedButton.png', 188, 71);
    game.load.image('happyEmote', 'assets/images/happyEmote.png');
    game.load.image('angryEmote', 'assets/images/angryEmote.png');


     game.load.image('autumn_ground1.png', 'assets/images/tiles/autumn_ground1.png');
     game.load.image('autumn_ground2.png', 'assets/images/tiles/autumn_ground2.png');
     game.load.image('autumn_ground3.png', 'assets/images/tiles/autumn_ground3.png');
     game.load.image('autumn_ground4.png', 'assets/images/tiles/autumn_ground4.png');
     game.load.image('autumn_water.png', 'assets/images/tiles/autumn_water.png');
     game.load.image('autumn_fenceBottomCorner.png', 'assets/images/tiles/autumn_fenceBottomCorner.png');
     game.load.image('autumn_fenceSideCorner.png', 'assets/images/tiles/autumn_fenceSideCorner.png');
     game.load.image('autumn_fenceStraight.png', 'assets/images/tiles/autumn_fenceStraight.png');
     game.load.image('autumn_fenceTopCorner.png', 'assets/images/tiles/autumn_fenceTopCorner.png');

    game.load.image('grassy_water.png', 'assets/images/tiles/grassy_water.png');
    game.load.image('grassy_1.png', 'assets/images/tiles/grassy_1.png');
    game.load.image('grassy_2.png', 'assets/images/tiles/grassy_2.png');
    game.load.image('grassy_3.png', 'assets/images/tiles/grassy_3.png');
    game.load.image('grassy_4.png', 'assets/images/tiles/grassy_4.png');
    game.load.image('grassy_fence_bottomCorner.png', 'assets/images/tiles/grassy_fence_bottomCorner.png');
     game.load.image('grassy_fence_length.png', 'assets/images/tiles/grassy_fence_length.png');
     game.load.image('grassy_fence_sideCorner.png', 'assets/images/tiles/grassy_fence_sideCorner.png');
     game.load.image('grassy_fence_topCorner.png', 'assets/images/tiles/grassy_fence_topCorner.png');
    game.load.image('dirtTile1.png', 'assets/images/tiles/dirtTile1.png');
    game.load.image('penTile_placeholder.png', 'assets/images/tiles/penTile_placeholder.png');
    game.load.image('penTile_placeholder2.png', 'assets/images/tiles/penTile_placeholder2.png');

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
    game.load.image('journalBg', 'assets/images/journal_bg2.png');
    game.load.image('cancelButton', 'assets/images/cancel_button.png');
    game.load.image('selectOrderButton', 'assets/images/selectOrderButton.png');
    game.load.image('nextLevelButton', 'assets/images/nextLevelButton.png');
    game.load.image('sideArrow', 'assets/images/sideArrow.png');
    game.load.image('inventoryLock', 'assets/images/HUD_items_lock.png');
    game.load.image('inventoryBg', 'assets/images/HUD_items_blank.png');
    game.load.image('inventoryClose', 'assets/images/HUD_close.png');
    game.load.image('dashedCircle', 'assets/images/dashedCircle.png');
    game.load.image('penArrowDown', 'assets/images/penArrow_downward.png');
    game.load.image('penArrowUp', 'assets/images/penArrow_upward.png');

    game.load.image('assistant', 'assets/images/assistant.png');
    game.load.image('speech_bubble', 'assets/images/speech_bubble1.png');

    game.load.image('bigO', 'assets/images/matchingGame_o.png');
    game.load.image('bigX', 'assets/images/matchingGame_x.png');
    game.load.image('tutorialArrow', 'assets/images/white_arrow.png');

    // Tilemap
    game.load.tilemap('testTileMap', 'assets/tilemaps/test.json');

    game.load.audio('backgroundMusic', 'assets/audio/gameplaybgm1.mp3');
    game.load.audio('bonusMusic', 'assets/audio/bgm_bonus.mp3');
    game.load.audio('eatingSound', 'assets/audio/eating.mp3');
    game.load.audio('footstepsSound', 'assets/audio/footsteps.mp3');
    game.load.audio('vomitSound', 'assets/audio/vomit.mp3');
    game.load.audio('failSound', 'assets/audio/fail.mp3');
    game.load.audio('successSound', 'assets/audio/success.mp3');
    game.load.audio('clickSound', 'assets/audio/button_click.mp3');

    // Quests
    game.load.json('vs_quest', 'assets/quests/vertical_slice.json');
    game.load.json('alpha_quest', 'assets/quests/alpha.json');
    game.load.json('alpha1', 'assets/quests/alpha1.json');
    game.load.json('alpha2', 'assets/quests/alpha2.json');
    game.load.json('alpha3', 'assets/quests/alpha3.json');
    game.load.json('alpha4', 'assets/quests/alpha4.json');

    game.plugins.add(new Phaser.Plugin.Isometric(game));
    game.plugins.add(new Phaser.Plugin.AStar(game));

    var loadingText = game.add.text(32, 32, "Loading...", { fill: '#ffffff' } );

    game.load.onFileComplete.add(function(progress, cacheKey, success, totalLoaded, totalFiles){
        loadingText.setText("Loading... "+progress+"%");
    }, this);
    game.load.onLoadComplete.add(function() {
        if (!GLOBAL.telemetryManager.initialized) {
            loadingText.setText("Waiting on SDK initialization...");
        }
    }, this);

    GLOBAL.loadingText = loadingText;
};
GlassLab.State.Init.prototype.create = function()
{
    var game = this.game;
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
    var tileData = game.cache.getTilemapData("testTileMap");

    var mapData = GLOBAL.tileManager.GenerateRandomMapData(20, 20);
    GLOBAL.tileManager.SetTileSize(GLOBAL.tileSize);
    GLOBAL.tileManager.SetCenter(10,10);
    GLOBAL.grassGroup = game.make.group();
    GLOBAL.tileManager.GenerateMapFromDataToGroup(mapData, GLOBAL.grassGroup);
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

    var table = new GlassLab.UITable(game, 1, 20);
    table.x = -70;
    table.y = 20;
    GLOBAL.UIManager.topRightAnchor.addChild(table);

    // pause icon
    var uiElement = new GlassLab.UIButton(game, 0, 0, "pauseIcon", function() {
        GLOBAL.pauseMenu.toggle();
    }, this);
    uiElement.scale.setTo(.5, .5);
    table.addManagedChild(uiElement);

    var zoomBG = new GlassLab.UIElement(game, 0, 0, "zoomBG");
    zoomBG.scale.setTo(.5, .5);
    table.addManagedChild(zoomBG);
    uiElement = new GlassLab.UIButton(game, 15, 40, "zoomInIcon", function() {
        GLOBAL.WorldLayer.scale.x *= 2;
        GLOBAL.WorldLayer.scale.y *= 2;
    }, this);
    zoomBG.addChild(uiElement);
    uiElement = new GlassLab.UIButton(game, 15, 110, "zoomOutIcon", function() {
        GLOBAL.WorldLayer.scale.x /= 2;
        GLOBAL.WorldLayer.scale.y /= 2;
    }, this);
    zoomBG.addChild(uiElement);

    var fullscreenUIElement = new GlassLab.UIButton(game, 0, 0, "fullscreenIcon", function() {
        if (game.scale.isFullScreen)
        {
            game.scale.stopFullScreen();
            fullscreenUIElement.loadTexture("fullscreenIcon");
        }
        else
        {
            game.scale.startFullScreen(false);
            fullscreenUIElement.loadTexture("fullscreenOffIcon");
        }
    }, this);
    fullscreenUIElement.scale.setTo(.5, .5);
    table.addManagedChild(fullscreenUIElement);
    table._refresh();

    table = new GlassLab.UITable(game, 1, 40);
    table.x = 20;
    table.y = 20;
    GLOBAL.UIManager.topLeftAnchor.addChild(table);

    uiElement = new GlassLab.UIButton(game, 0,0, "journalIcon", function() {
        if (!GLOBAL.Journal.IsShowing())
        {
            journalAlert.visible = false;
            GLOBAL.Journal.Show();
        }
        else
        {
            GLOBAL.Journal.Hide();
        }
    }, this );
    uiElement.scale.setTo(.6, .6);
    var journalAlert = game.make.sprite(0,0,"alertIcon");
    journalAlert.anchor.setTo(.5,.5);
    journalAlert.visible = false;
    GlassLab.SignalManager.levelWon.add(function(level){ this.visible = true; }, journalAlert);
    uiElement.addChild(journalAlert);
    table.addManagedChild(uiElement);

    uiElement = new GlassLab.UIRectButton(game, 0,0, function(){
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

    uiElement = new GlassLab.UIButton(game, 20, -100, "itemsIcon", function() {
        if (!GLOBAL.inventoryMenu.visible)
        {
            GLOBAL.inventoryMenu.Show();
        }
        else
        {
            GLOBAL.inventoryMenu.Hide();
        }
    }, this);
    uiElement.scale.setTo(.6, .6);
    GLOBAL.UIManager.bottomLeftAnchor.addChild(uiElement);
    GLOBAL.itemsButton = uiElement;

    // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
    GLOBAL.lastMousePosition = new Phaser.Point();

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
    //game.scale.enterFullScreen.add(onEnterFullScreen, this);
    //game.scale.leaveFullScreen.add(onLeaveFullScreen, this);

    var journal = new GlassLab.Journal(game);
    journal.sprite.scale.setTo(1,1);
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
    GLOBAL.UIManager.bottomLeftAnchor.addChild(inventoryMenu);
    GLOBAL.inventoryMenu = inventoryMenu;

    var assistant = new GlassLab.Assistant(game);
    assistant.sprite.x = -80;
    assistant.sprite.y = -100;
    GLOBAL.UIManager.bottomRightAnchor.addChild(assistant.sprite);
    GLOBAL.assistant = assistant;

    var versionLabel = game.make.text(0,0,"v"+GLOBAL.version, {font: "8pt Arial", fill:'#ffffff'});
    versionLabel.fixedToCamera = true;
    GLOBAL.UIGroup.add(versionLabel);

    GLOBAL.sortingGame = new GlassLab.SortingGame(game);
    GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.sortingGame);
    GLOBAL.sortingGame.y = -GLOBAL.sortingGame.height / 2;

    GLOBAL.pauseMenu = new GlassLab.PauseMenu(game);
    GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.pauseMenu);

    GLOBAL.levelManager = new GlassLab.LevelManager(GLOBAL.game);

    GLOBAL.questManager = new GlassLab.QuestManager(GLOBAL.game);

    GLOBAL.dayManager = new GlassLab.DayManager(GLOBAL.game);

    GLOBAL.audioManager = new GlassLab.AudioManager(GLOBAL.game);

    this.initComplete = true;
};

GlassLab.State.Init.prototype.update = function()
{
    if (this.initComplete && GLOBAL.telemetryManager.initialized)
    {
        GLOBAL.loadingText.destroy();
        delete GLOBAL.loadingText;
        this.game.state.start("Game", false);
    }
};
