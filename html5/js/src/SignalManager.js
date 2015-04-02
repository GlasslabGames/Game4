/**
 * Created by Jerry Fu on 1/9/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.SignalManager = {
    gameInitialized: new Phaser.Signal(), // when we're ready to start the game (after the save blob has loaded)

    // Update
    update: new Phaser.Signal(), // (float) => time since last update - update loop

    // Save/Load
    saveRequested: new Phaser.Signal(), // (obj) => save blob - attach any save info to the blob
    gameLoaded: new Phaser.Signal(), // (obj) => save blob - load any data from the save blob

    // UI Events
    journalOpened: new Phaser.Signal(),
    journalClosed: new Phaser.Signal(),
    inventoryOpened: new Phaser.Signal(),
    inventoryClosed: new Phaser.Signal(),
    mailOpened: new Phaser.Signal(),
    mailClosed: new Phaser.Signal(),
    uiFocusChanged: new Phaser.Signal(),

    // Tutorial
    tutorialAdvanced: new Phaser.Signal(), // used to advance to the next action in the tutorial

    // Level/challenge/quest Events
    levelStarted: new Phaser.Signal(),
    bonusGameComplete: new Phaser.Signal(),
    challengeStarted: new Phaser.Signal(),
    challengeComplete: new Phaser.Signal(), // (success)
    objectiveUpdated: new Phaser.Signal(), // (string) => new objective
    questStarted: new Phaser.Signal(), // (Quest) => quest that was started
    questEnded: new Phaser.Signal(), // (Quest) => quest that ended

    // Creature Events
    creatureTargetsChanged: new Phaser.Signal(),
    creatureEats: new Phaser.Signal(),
    creatureFed: new Phaser.Signal(), // when it's satisfied

    // Pen Events
    penResized: new Phaser.Signal(), // (FeedingPen, string, string) => source, prevDimensions, newDimensions // only when the player resizes it
    feedingPenResolved: new Phaser.Signal(), // (FeedingPen, bool) => source, win/loss
    penFeedingStarted: new Phaser.Signal(),
    penFoodTypeSet: new Phaser.Signal(), // pen, food type added, list of food types
    tilePenStateChanged: new Phaser.Signal(), // tile, pen - Sent when a tile's SetInPen is called

    // Order Events
    ordersChanged: new Phaser.Signal(), // when an order is added or removed
    rewardAdded: new Phaser.Signal(), // when the reward message is added (currently used in Day2 tutorial)
    orderStarted: new Phaser.Signal(), // (order) => order that was started
    orderCanceled: new Phaser.Signal(), // (order) => order that was canceled
    orderResolved: new Phaser.Signal(), // (order, result) => after the order finishes and the player closes the reward popup
    orderShipped: new Phaser.Signal(), // (order, result) => after the order is sent off and the player has to open the reward popup to proceed

    // Inventory Events
    moneyChanged: new Phaser.Signal(), // (float) => amount money changed - negative if deducted
    foodDropped: new Phaser.Signal() // food
};
