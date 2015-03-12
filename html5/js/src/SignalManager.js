/**
 * Created by Jerry Fu on 1/9/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.SignalManager = {
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
    tutorialAdvanced: new Phaser.Signal(),

    // Level Events
    levelLoaded: new Phaser.Signal(),
    levelWon: new Phaser.Signal(),
    levelLost: new Phaser.Signal(),
    bonusGameComplete: new Phaser.Signal(),

    challengeStarted: new Phaser.Signal(),
    challengeComplete: new Phaser.Signal(),

    // Creature Events
    creatureTargetsChanged: new Phaser.Signal(),
    creatureFed: new Phaser.Signal(),

    // Pen Events
    penResized: new Phaser.Signal(), // (FeedingPen, string, string) => source, prevDimensions, newDimensions // only when the player resizes it
    feedingPenResolved: new Phaser.Signal(), // (FeedingPen, bool) => source, win/loss
    penFeedingStarted: new Phaser.Signal(),
    penFoodTypeSet: new Phaser.Signal(),

    // Order Events
    ordersChanged: new Phaser.Signal(), // when an order is added or removed
    orderStarted: new Phaser.Signal(), // (order) => order that was started
    orderCanceled: new Phaser.Signal(), // (order) => order that was started
    orderCompleted: new Phaser.Signal(), // (order) => order that was completed
    orderFailed: new Phaser.Signal(), // (order) => order that was failed

    // Quest Events
    objectiveUpdated: new Phaser.Signal(), // (string) => new objective
    questStarted: new Phaser.Signal(), // (Quest) => quest that was started
    questEnded: new Phaser.Signal(), // (Quest) => quest that ended
    dayReset: new Phaser.Signal(),
    challengeStarted: new Phaser.Signal(),
    challengeSubmitted: new Phaser.Signal(),

    // Inventory Events
    moneyChanged: new Phaser.Signal(), // (float) => amount money changed - negative if deducted
    foodDropped: new Phaser.Signal()
};
