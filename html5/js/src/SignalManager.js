/**
 * Created by Jerry Fu on 1/9/2015.
 */


var GlassLab = GlassLab || {};

GlassLab.SignalManager = {
    update: new Phaser.Signal(),
    journalClosed: new Phaser.Signal(),
    levelLoaded: new Phaser.Signal(),
    levelWon: new Phaser.Signal(),
    levelLost: new Phaser.Signal(),
    creatureTargetsChanged: new Phaser.Signal(),
    creatureFed: new Phaser.Signal(),
    feedingPenResolved: new Phaser.Signal(), // (FeedingPen, bool) => (source, win/loss)
    orderAdded: new Phaser.Signal(), // (order) => (added order)
    moneyChanged: new Phaser.Signal(),
    uiFocusChanged: new Phaser.Signal()
};
