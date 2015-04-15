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
    GLOBAL.telemetryManager = new GlassLab.TelemetryManager();

    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer');
    GLOBAL.game = game;
    GLOBAL.version = "0.3.0";
    GLOBAL.debug = (getParameterByName("debug") == "true");
    GLOBAL.stickyMode = (getParameterByName("sticky") == "true"); // If true, click to grab something or put it down. If false, drag things around.
    GLOBAL.UIpriorityID = 100; // set the input.priorityID on all UI elements to this so they'll be above the game elements

    game.state.add("Init", GlassLab.State.Init);
    game.state.add("Game", GlassLab.State.Game);

    game.state.start("Init");
};
