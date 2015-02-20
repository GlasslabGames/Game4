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
    journalClosed: new Phaser.Signal(),
    uiFocusChanged: new Phaser.Signal(),

    // Level Events
    levelLoaded: new Phaser.Signal(),
    levelWon: new Phaser.Signal(),
    levelLost: new Phaser.Signal(),

    // Creature Events
    creatureTargetsChanged: new Phaser.Signal(),
    creatureFed: new Phaser.Signal(),

    // Pen Events
    feedingPenResolved: new Phaser.Signal(), // (FeedingPen, bool) => source, win/loss

    // Order Events
    orderAdded: new Phaser.Signal(), // (order) => added order

    // Quest Events
    objectiveUpdated: new Phaser.Signal(), // (string) => new objective
    questStarted: new Phaser.Signal(), // (Quest) => quest that was started
    dayReset: new Phaser.Signal(),
    challengeStarted: new Phaser.Signal(),
    challengeSubmitted: new Phaser.Signal(),

    // Inventory Events
    moneyChanged: new Phaser.Signal() // (float) => amount money changed - negative if deducted
};
