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

    var creatureSpriteNames = ["ram", "unifox", "babyram", "babyunifox", "bird", "babybird"];
    for (var i = 0; i < creatureSpriteNames.length; i++) {
        var spriteName = creatureSpriteNames[i];
        game.load.image(spriteName+'_idle', 'assets/images/creatures/'+spriteName+'_idle.png');
        game.load.image(spriteName+'_idle_back', 'assets/images/creatures/'+spriteName+'_idlebf.png');
        game.load.atlasJSONHash(spriteName+'_walk', 'assets/images/creatures/'+spriteName+'_walk.png', 'assets/images/creatures/'+spriteName+'_walk.json');
        game.load.atlasJSONHash(spriteName+'_walk_back', 'assets/images/creatures/'+spriteName+'_walkbf.png', 'assets/images/creatures/'+spriteName+'_walkbf.json');
        game.load.atlasJSONHash(spriteName+'_eat', 'assets/images/creatures/'+spriteName+'_eat.png', 'assets/images/creatures/'+spriteName+'_eat.json');
        game.load.atlasJSONHash(spriteName+'_vomit', 'assets/images/creatures/'+spriteName+'_vomit.png', 'assets/images/creatures/'+spriteName+'_vomit.json');
        game.load.atlasJSONHash(spriteName+'_poop', 'assets/images/creatures/'+spriteName+'_poop.png', 'assets/images/creatures/'+spriteName+'_poop.json');
        game.load.atlasJSONHash(spriteName+'_cry_end', 'assets/images/creatures/'+spriteName+'_cry_end.png', 'assets/images/creatures/'+spriteName+'_cry_end.json');
        game.load.atlasJSONHash(spriteName+'_cry_loop', 'assets/images/creatures/'+spriteName+'_cry_loop.png', 'assets/images/creatures/'+spriteName+'_cry_loop.json');
        game.load.atlasJSONHash(spriteName+'_cry_start', 'assets/images/creatures/'+spriteName+'_cry_start.png', 'assets/images/creatures/'+spriteName+'_cry_start.json');
        game.load.image(spriteName+'_art', 'assets/images/creatures/portrait_'+spriteName+'.png');
        game.load.image(spriteName+'_art_white', 'assets/images/creatures/portrait_'+spriteName+'_white.png');
        game.load.image(spriteName+'_sticker', 'assets/images/creatures/stickers/creature_sticker_'+spriteName+'.png');
        game.load.image(spriteName+'_photo', 'assets/images/journal/journal_photo_'+spriteName+'.png');
        game.load.image(spriteName+'_mystery_photo', 'assets/images/journal/mystery_photo_'+spriteName+'.png');

        game.load.audio(spriteName+'_sfx_footstep0', 'assets/audio/sfx/'+spriteName+'_footsteps_1.mp3');
        game.load.audio(spriteName+'_sfx_footstep1', 'assets/audio/sfx/'+spriteName+'_footsteps_2.mp3');
        game.load.audio(spriteName+'_sfx_footstep2', 'assets/audio/sfx/'+spriteName+'_footsteps_3.mp3');
        game.load.audio(spriteName+'_sfx_footstep3', 'assets/audio/sfx/'+spriteName+'_footsteps_4.mp3');
        game.load.audio(spriteName+'_sfx_footstep4', 'assets/audio/sfx/'+spriteName+'_footsteps_4x.mp3');
        game.load.audio(spriteName+'_sfx_throwup', 'assets/audio/sfx/'+spriteName+'_throwup.mp3');
        game.load.audio(spriteName+'_sfx_happy', 'assets/audio/sfx/'+spriteName+'_happy.mp3');
        game.load.audio(spriteName+'_sfx_eat', 'assets/audio/sfx/'+spriteName+'_eat.mp3');

        game.load.image(spriteName+'_orderPhoto_cry', 'assets/images/order/response_photos/order_fail_'+spriteName+'.png');
        game.load.image(spriteName+'_orderPhoto_happy', 'assets/images/order/response_photos/order_success_'+spriteName+'.png');
        game.load.image(spriteName+'_orderPhoto_vomit', 'assets/images/order/response_photos/order_response_photos_vomit_'+spriteName+'.png');
        game.load.image(spriteName+'_orderPhoto_wrongFood', 'assets/images/order/response_photos/order_response_photos_wrong_food_'+spriteName+'.png');
    }

    var basicFoodSpriteNames = ["apple", "broccoli", "corn", "donut", "meat", "mushroom", "pizza", "strawberry", "taco", "tincan"];
    for (var i = 0; i < basicFoodSpriteNames.length; i++) {
        game.load.image(basicFoodSpriteNames[i], 'assets/images/food/food_standard/food_standard_'+basicFoodSpriteNames[i]+'.png');
        game.load.image(basicFoodSpriteNames[i]+'_sticker', 'assets/images/food/food_stickers/food_sticker_'+basicFoodSpriteNames[i]+'.png');
        game.load.image(basicFoodSpriteNames[i]+'_shadow', 'assets/images/food/food_shadows/food_shadow_'+basicFoodSpriteNames[i]+'.png');
    }

    var animFoodSpriteNames = ["apple", "strawberry", "tincan", "broccoli"];
    for (var i = 0; i < animFoodSpriteNames.length; i++) {
        spriteName = animFoodSpriteNames[i];
        game.load.atlasJSONHash(spriteName+'_eaten', 'assets/images/food/'+spriteName+'_death_VFX.png', 'assets/images/food/'+spriteName+'_death_VFX.json');
        game.load.atlasJSONHash(spriteName+'_eaten_long', 'assets/images/food/'+spriteName+'_long_death_VFX.png', 'assets/images/food/'+spriteName+'_long_death_VFX.json');
    }

    game.load.image('shadow', 'assets/images/iso_shadow2.png');
    game.load.atlasJSONHash('vomit', 'assets/images/vomit_vfx.png', 'assets/images/vomit_vfx.json');

    game.load.atlasJSONHash('crate', 'assets/images/crate/crate.png', 'assets/images/crate/crate.json');
    game.load.image('crate_shadow', 'assets/images/crate/crate_shadow.png');
    game.load.image('crate_frontBottom', 'assets/images/crate/crate_wall_front_left_solid2.png');
    game.load.image('crate_frontBottom_window', 'assets/images/crate/crate_wall_front_left_window2.png');
    game.load.image('crate_frontRight', 'assets/images/crate/crate_wall_front_right_solid2.png');
    game.load.image('crate_lidCorner', 'assets/images/crate/crate_lid_back_corner.png');
    game.load.image('crate_lidTop', 'assets/images/crate/crate_lid_back_right.png');
    game.load.image('crate_lidBottom', 'assets/images/crate/crate_lid_front_left.png');
    game.load.image('crate_lidLeft', 'assets/images/crate/crate_lid_back_left.png');
    game.load.image('crate_lidRight', 'assets/images/crate/crate_lid_front_right.png');
    game.load.atlasJSONHash('propellerAnim', 'assets/images/crate/propeller_animations.png', 'assets/images/crate/propeller_animations.json');

    game.load.image('penFenceLeft', 'assets/images/pen/feeding_fence_down_left.png');
    game.load.image('penFenceRight', 'assets/images/pen/feeding_fence_down_right.png');
    game.load.image('dottedLineLeft', 'assets/images/pen/dotted_line_left.png');
    game.load.image('dottedLineRight', 'assets/images/pen/dotted_line_right.png');

    game.load.atlasJSONHash('gateDown', 'assets/images/pen/feeding_gate_down.png', 'assets/images/pen/feeding_gate_down.json');
    game.load.atlasJSONHash('gateUp', 'assets/images/pen/feeding_gate_up.png', 'assets/images/pen/feeding_gate_up.json');
    game.load.image('gateCapNear', 'assets/images/pen/feeding_gate_endcap_near.png');
    game.load.image('gateCapFar', 'assets/images/pen/feeding_gate_endcap_far.png');
    game.load.image('gateSwitchBack', 'assets/images/pen/gate_switch_back.png');
    game.load.image('gateHover', 'assets/images/pen/switch_hover.png');
    game.load.atlasJSONHash('gateSwitchFlip', 'assets/images/pen/switch_flip.png', 'assets/images/pen/switch_flip.json');
    game.load.atlasJSONHash('gateSwitchFail', 'assets/images/pen/switch_fail.png', 'assets/images/pen/switch_fail.json');
    game.load.atlasJSONHash('gateLightGreen', 'assets/images/pen/switch_light_green.png', 'assets/images/pen/switch_light_green.json');
    game.load.atlasJSONHash('gateLightRed', 'assets/images/pen/switch_light_red.png', 'assets/images/pen/switch_light_red.json');

    game.load.spritesheet('button', 'assets/images/feedButton.png', 188, 71);
    game.load.image('happyEmote', 'assets/images/emotes/happyEmote.png');
    game.load.image('angryEmote', 'assets/images/emotes/angryEmote.png');

    game.load.atlasJSONHash('tiles_v2', 'assets/images/tiles/tiles_v2.png', 'assets/images/tiles/tiles_v2.json');
    game.load.image('squareGrassTile', 'assets/images/tiles/grass_blank_1.png');

    game.load.image('penTooltipCap', 'assets/images/pen/pen_tooltip_cap.png');
    game.load.image('penTooltipCapTall', 'assets/images/pen/pen_tooltip_cap_tall.png');
    game.load.image('penTooltipWidth', 'assets/images/pen/pen_tooltip_width.png');

    // Cloud shadow
    game.load.image('cloudShadow', 'assets/images/cloudShadow.png');

    // UI
    game.load.image('closeIcon', 'assets/images/Close-button.png');
    game.load.image('alertIcon', 'assets/images/prima_HUD_alertBadge.png');
    game.load.image('journalBg', 'assets/images/journal/hud_journal.png');
    game.load.image('cancelButton', 'assets/images/cancel_button.png');
    game.load.image('selectOrderButton', 'assets/images/selectOrderButton.png');
    game.load.image('nextLevelButton', 'assets/images/nextLevelButton.png');
    game.load.image('sideArrow', 'assets/images/journal/hud_journal_paging_arrow.png');
    game.load.image('inventoryLock', 'assets/images/HUD_items_lock.png');
        game.load.image('inventoryBg', 'assets/images/HUD_items_blank.png');
    game.load.image('inventoryClose', 'assets/images/HUD_close.png');
    game.load.image('dashedCircle', 'assets/images/dashedCircle.png');
    game.load.image('penArrowDown', 'assets/images/penArrow_downward.png');
    game.load.image('penArrowUp', 'assets/images/penArrow_upward.png');

    game.load.image('bigO', 'assets/images/matchingGame_o.png');
    game.load.image('bigX', 'assets/images/matchingGame_x.png');
    game.load.image('tutorialArrow', 'assets/images/white_arrow.png');

    // New UI
    game.load.image('hudSettingsBgRounded', 'assets/images/hud/hud_button_settings_rounded.png');
    game.load.image('hudSettingsBg', 'assets/images/hud/hud_button_settings_square.png');
    game.load.image('zoomInIcon', 'assets/images/hud/hud_icon_zoomin.png');
    game.load.image('zoomOutIcon', 'assets/images/hud/hud_icon_zoomout.png');
    game.load.image('fullscreenIcon', 'assets/images/hud/hud_icon_enter_fullscreen.png');
    game.load.image('fullscreenOffIcon', 'assets/images/hud/hud_icon_exit_fullscreen.png');
    game.load.image('pauseIcon', 'assets/images/hud/hud_icon_pause.png');
    game.load.image('cancelIcon', 'assets/images/order/shipping_ui_hud_cancel.png');
    game.load.image('hudBg', 'assets/images/hud/hud_button_panel.png');

    game.load.image('notesIcon', 'assets/images/hud/hud_notes/notes_static.png');
    game.load.image('notesIcon_open', 'assets/images/hud/hud_notes/notes_static_open.png');
    game.load.atlasJSONHash('notesIcon_anim', 'assets/images/hud/hud_notes/notes_full.png', 'assets/images/hud/hud_notes/notes_full.json');
    game.load.image('mailIcon', 'assets/images/hud/hud_mail/mailbox_static.png');
    game.load.image('mailIcon_open', 'assets/images/hud/hud_mail/mailbox_static_empty_open.png');
    game.load.image('mailIcon_open_full', 'assets/images/hud/hud_mail/mailbox_static_full_open.png');
    game.load.image('mailIcon_full', 'assets/images/hud/hud_mail/mailbox_static_full.png');
    game.load.atlasJSONHash('mailIcon_anim', 'assets/images/hud/hud_mail/mailbox_full.png', 'assets/images/hud/hud_mail/mailbox_full.json');

    game.load.image('orderBg', 'assets/images/order/shipping_ui_packing_slip_bg.png');
    game.load.image('orderBg2', 'assets/images/order/shipping_ui_packing_slip_tall_bg.png');
    game.load.image('orderDragTarget', 'assets/images/order/shipping_ui_drag_food_here.png');
    game.load.image('orderEntryField', 'assets/images/order/shipping_ui_number_field.png');

    game.load.image('letterBg', 'assets/images/order/order_letter_bg.png');
    game.load.image('bossmanPhoto', 'assets/images/order/order_photo_bossman.png');
    game.load.image('urgentStamp', 'assets/images/order/urgent_stamp.png');
    game.load.image('letterButtonBg', 'assets/images/order/order_fill_button_bg.png');
    game.load.image('approvedStamp', 'assets/images/order/order_fill_approve_stamp.png');
    game.load.image('bigCoin', 'assets/images/order/order_response_big_coin.png');
    game.load.atlasJSONHash('coinAnim', 'assets/images/order/get_money.png', 'assets/images/order/get_money.json');

    game.load.image('questBarDotLarge', 'assets/images/hud/hud_questbar_large_dot.png');
    game.load.image('questBarDotSmall', 'assets/images/hud/hud_questbar_small_dot.png');
    game.load.atlasJSONHash('questBarSun', 'assets/images/hud/hud_sun/hud_mission_sun.png', 'assets/images/hud/hud_sun/hud_mission_sun.json');
    game.load.image('questObjectiveBg', 'assets/images/hud/hud_current_quest_background.png');
    game.load.image('questObjectiveArrow', 'assets/images/hud/hud_current_quest_arrow.png'); // also used in food tooltips

    game.load.image('foodIconBg_open', 'assets/images/hud/hud_food/hud_food_button_bg_open.png');
    game.load.image('foodIcon', 'assets/images/hud/hud_food/food_static.png');
    game.load.image('foodIcon_open', 'assets/images/hud/hud_food/food_static_open.png');
    game.load.atlasJSONHash('foodIcon_anim', 'assets/images/hud/hud_food/food_full.png', 'assets/images/hud/hud_food/food_full.json');
    game.load.image('inventoryMoneyBg', 'assets/images/hud/hud_food/hud_food_money_bg.png');
    game.load.image('inventoryCoinIcon', 'assets/images/hud/hud_food/hud_food_money_coin.png');
    game.load.image('inventoryCoin', 'assets/images/hud/hud_food/hud_food_item_coin.png');
    game.load.image('foodBarBg', 'assets/images/hud/hud_food/hud_food_bar_width.png');
    game.load.image('foodBarBgEndcap', 'assets/images/hud/hud_food/hud_food_bar_endcap.png');
    game.load.image('foodItemEmptyTexture', 'assets/images/hud/hud_food/hud_food_item_empty_texture.png');
    game.load.image('foodItemBg', 'assets/images/hud/hud_food/hud_food_item_bg.png');
    game.load.image('foodLabelBg', 'assets/images/hud/hud_food/hud_food_label_bg_width.png');
    game.load.image('foodLabelBgEndcap', 'assets/images/hud/hud_food/hud_food_label_bg_endcap.png');

    // bonus game
    game.load.image('bonusBoardBg', 'assets/images/bonus_game/bonus_board_bg.png');
    game.load.image('bonusCheckmark', 'assets/images/bonus_game/bonus_checkmark.png');
    game.load.image('bonusXmark', 'assets/images/bonus_game/bonus_xmark.png');
    game.load.image('bonusNotEnough', 'assets/images/bonus_game/bonus_not_enough.png');
    game.load.image('bonusJustRight', 'assets/images/bonus_game/bonus_just_right.png');
    game.load.image('bonusTooMuch', 'assets/images/bonus_game/bonus_too_much.png');
    game.load.image('bonusCorrectionNotEnough', 'assets/images/bonus_game/bonus_correction_not_enough.png');
    game.load.image('bonusCorrectionJustRight', 'assets/images/bonus_game/bonus_correction_just_right.png');
    game.load.image('bonusCorrectionTooMuch', 'assets/images/bonus_game/bonus_correction_too_much.png');
    game.load.image('bonusStickerDropzone', 'assets/images/bonus_game/bonus_sticker_dropzone.png');
    game.load.image('bonusStickerDropzoneShader', 'assets/images/bonus_game/bonus_sticker_dropzone_shader.png');
    game.load.image('bonusStickerOverlay', 'assets/images/bonus_game/bonus_sticker_overlay.png');
    game.load.atlasJSONHash('bonusAnims', 'assets/images/bonus_game/bonus_anims.png', 'assets/images/bonus_game/bonus_anims.json');
        game.load.image('bigO', 'assets/images/matchingGame_o.png');
        game.load.image('bigX', 'assets/images/matchingGame_x.png');

    // creature thought bubble
    game.load.image('exclamationPoint', 'assets/images/thought_bubble/thought_bubble_exclamation_point.png');
    game.load.image('questionMark', 'assets/images/thought_bubble/thought_bubble_question_mark.png');
    game.load.image('redX', 'assets/images/thought_bubble/thought_bubble_red_x.png');
    game.load.image('thoughtBubbleStem', 'assets/images/thought_bubble/thought_bubble_stem.png');
    game.load.atlasJSONHash('thoughtBubble', 'assets/images/thought_bubble/thought_bubble.png', 'assets/images/thought_bubble/thought_bubble.json');

    // assistant
    game.load.image('assistantIcon', 'assets/images/assistant.png');
    game.load.image('speech_bubble', 'assets/images/assistant/assistant_speech.png');
    game.load.image('speech_bubble_small', 'assets/images/assistant/assistant_speech_min.png');
    game.load.image('speech_bubble_dots', 'assets/images/assistant/assistant_speech_min_dots.png');
    game.load.atlasJSONHash('assistantAnim', 'assets/images/assistant/assistant_animations.png', 'assets/images/assistant/assistant_animations.json');

    // drop target
    game.load.image('dropTargetRing', 'assets/images/drop_target_outer_ring.png');
    game.load.image('dropTargetX', 'assets/images/drop_target_inner_x.png');

    // poop
    game.load.atlasJSONHash('poopAnim', 'assets/images/poo/poo.png', 'assets/images/poo/poo.json');

    // Tilemap
    game.load.tilemap('worldTileMap', 'assets/tilemaps/prima_world.json', null, Phaser.Tilemap.TILED_JSON);

    game.load.audio('backgroundMusic', 'assets/audio/bgm/cc_in-game_music_loop.mp3');
    game.load.audio('menuMusic', 'assets/audio/bgm/cc_menu_music_loop.mp3');
    game.load.audio('bonusMusic', 'assets/audio/bgm/cc_menu_music_loop.mp3');
    game.load.audio('failSound', 'assets/audio/sfx/lose_mini_game.mp3');
    game.load.audio('successSound', 'assets/audio/sfx/win_mini_game.mp3');
    game.load.audio('clickSound', 'assets/audio/sfx/general_click.mp3');
    game.load.audio('popUpSound', 'assets/audio/sfx/pop_up_notification.mp3');
    game.load.audio('gateDropSound', 'assets/audio/sfx/drop_pen_gate.mp3');
    game.load.audio('mailNoticeSound', 'assets/audio/sfx/mail_notice.mp3');

    // Quests
    game.load.json('day1', 'assets/quests/day1.json');
    game.load.json('day2', 'assets/quests/day2.json');
    game.load.json('day3', 'assets/quests/day3.json');
    game.load.json('day4', 'assets/quests/day4.json');
    game.load.json('day5', 'assets/quests/day5.json');
    game.load.json('day6', 'assets/quests/day6.json');
    game.load.json('day7', 'assets/quests/day7.json');

    game.plugins.add(Phaser.Plugin.Isometric);
    GLOBAL.astar = game.plugins.add(Phaser.Plugin.AStar);
    GLOBAL.astar._useDiagonal = false;

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
    game.world.setBounds(-Number.MAX_VALUE/2, -Number.MAX_VALUE/2, Number.MAX_VALUE, Number.MAX_VALUE);

    // Setup world
    game.iso.anchor.setTo(0,0);
    game.iso.projectionAngle = 0.52359877559829887307710723054658; // 30 degree angle

    GLOBAL.WorldLayer = game.add.group();
    GLOBAL.UILayer = game.add.group();
    GLOBAL.UILayer.visible = GLOBAL.WorldLayer.visible = false;

    GLOBAL.tileSize = 115; // Art tile size is about 139 (guessed with trial and error)

    GLOBAL.foodInWorld = [];

    game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);

    // Save Manager
    GLOBAL.saveManager = new GlassLab.SaveManager(game);

    GLOBAL.creatureManager = new GlassLab.CreatureManager(GLOBAL.game);
    GLOBAL.penManager = new GlassLab.PenManager(GLOBAL.game);

    GLOBAL.inventoryManager = new GlassLab.InventoryManager(GLOBAL.game);

    GLOBAL.grassGroup = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.grassGroup);

    GLOBAL.renderManager = new GlassLab.RenderManager(GLOBAL.game);

    GLOBAL.tiledBg = game.make.tileSprite(0, 0, 100, 100, "squareGrassTile");
    GLOBAL.tiledBg.anchor.setTo(0.5, 0.5);
    GLOBAL.tiledBg.visible = false;
    GLOBAL.WorldLayer.add(GLOBAL.tiledBg);

    GLOBAL.baseWorldLayer = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.baseWorldLayer);

    GLOBAL.penLayer = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.penLayer);

    GLOBAL.foodLayer = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.foodLayer);

    GLOBAL.creatureLayer = null; // Created by TileManager now

    GLOBAL.effectLayer = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.effectLayer);

    GLOBAL.hoverLayer = game.make.group();
    GLOBAL.WorldLayer.add(GLOBAL.hoverLayer);

    GLOBAL.paused = false;

    // Create TileManager and map
    GLOBAL.tileManager = new GlassLab.TileManager(GLOBAL.game);

    var mapData = GLOBAL.tileManager.GenerateMapData("worldTileMap");
    GLOBAL.tileManager.SetTileSize(GLOBAL.tileSize);
    GLOBAL.tileManager.GenerateMapFromDataToGroup(mapData, GLOBAL.grassGroup);

    // Add clouds
    GLOBAL.cloudManager = new GlassLab.CloudManager(game);
    GLOBAL.WorldLayer.add(GLOBAL.cloudManager.renderGroup);

    // Add UI
    GLOBAL.UIManager = new GlassLab.UIManager(GLOBAL.game);

    // Point to track last mouse position (for some reason Phaser.Pointer.movementX/Y doesn't seem to work)
    GLOBAL.lastMousePosition = new Phaser.Point();

    game.scale.fullScreenScaleMode = Phaser.ScaleManager.RESIZE;
    //game.scale.enterFullScreen.add(onEnterFullScreen, this);
    //game.scale.leaveFullScreen.add(onLeaveFullScreen, this);

    var journal = new GlassLab.Journal(game);
    GLOBAL.UIManager.centerAnchor.addChild(journal);
    GLOBAL.Journal = journal;

    GLOBAL.mailManager = new GlassLab.MailManager(game);

    var orderFulfillment = new GlassLab.OrderFulfillment(game);
    orderFulfillment.sprite.x = 250;
    orderFulfillment.sprite.y = -110; // or 250 if the inventory is closed?
    GLOBAL.UIManager.bottomLeftAnchor.addChild(orderFulfillment.sprite);
    GLOBAL.orderFulfillment = orderFulfillment;

    var inventoryMenu = new GlassLab.InventoryMenu(game);
    GLOBAL.UIManager.bottomLeftAnchor.addChild(inventoryMenu);
    GLOBAL.inventoryMenu = inventoryMenu;

    GLOBAL.inventoryMoneyTab = new GlassLab.InventoryMoneyTab(game, GLOBAL.itemsButton.x, -105);
    GLOBAL.UIManager.bottomLeftAnchor.addChild(GLOBAL.inventoryMoneyTab);

    var assistant = new GlassLab.Assistant(game);
    GLOBAL.UIManager.tutorialAnchor.addChild(assistant.sprite);
    GLOBAL.assistant = assistant;

    var versionLabel = game.make.text(0,0,"v"+GLOBAL.version, {font: "8pt Arial", fill:'#ffffff'});
    versionLabel.fixedToCamera = true;
    GLOBAL._averageFrameTime = 33;
    GlassLab.SignalManager.update.add(function(dt)
    {
        GLOBAL._averageFrameTime = (GLOBAL._averageFrameTime * 49 + dt) / 50;
        this.setText("v"+GLOBAL.version + " - " + Math.round(1000.0/GLOBAL._averageFrameTime) + "fps")
    }, versionLabel);
    GLOBAL.UILayer.add(versionLabel);

    GLOBAL.sortingGame = new GlassLab.SortingGame(game);
    GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.sortingGame);
    GLOBAL.sortingGame.y = -GLOBAL.sortingGame.height / 2;

    GLOBAL.pauseMenu = new GlassLab.PauseMenu(game);
    GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.pauseMenu);

    GLOBAL.levelManager = new GlassLab.LevelManager(GLOBAL.game);

    GLOBAL.questManager = new GlassLab.QuestManager(GLOBAL.game);

    GLOBAL.dayManager = new GlassLab.DayManager(GLOBAL.game);

    GLOBAL.audioManager = new GlassLab.AudioManager(GLOBAL.game);

    GLOBAL.resourceManager = new GlassLab.ResourceManager(GLOBAL.game);

    GLOBAL.dropTarget = new GlassLab.WorldDropTarget(game);
    GLOBAL.baseWorldLayer.add(GLOBAL.dropTarget);

    GLOBAL.transition = new GlassLab.Transition(game);
    GLOBAL.UIManager.transitionAnchor.addChild(GLOBAL.transition);

    //GLOBAL.debugText = game.make.text(-300,0,"test");
    //GLOBAL.UIManager.centerAnchor.addChild(GLOBAL.debugText);

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
