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
    moneyChanged: new Phaser.Signal()
};