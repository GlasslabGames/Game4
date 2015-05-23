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
    GLOBAL.fullScreenAllowed = document.fullscreenEnabled ||
        document.webkitFullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled;

    GLOBAL.telemetryManager = new GlassLab.TelemetryManager();

    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer');
    GLOBAL.game = game;
    GLOBAL.version = "1.0.0";
    GLOBAL.debug = (getParameterByName("debug") == "true");
    GLOBAL.stickyMode = (getParameterByName("sticky") == "true"); // If true, click to grab something or put it down. If false, drag things around.
    GLOBAL.UIpriorityID = 100; // set the input.priorityID on all UI elements to this so they'll be above the game elements
    GLOBAL.penAreaWidth = 26;
    GLOBAL.penAreaHeight = 28;

    game.state.add("Boot", GlassLab.State.Boot);
    game.state.add("Init", GlassLab.State.Init);
    game.state.add("Game", GlassLab.State.Game);
    game.state.add("Title", GlassLab.State.Title);

    game.state.start("Boot");
};

Math.sign = Math.sign || function(x) {
    x = +x;
    if (x === 0 || isNaN(x))
    {
        return x;
    }
    return x > 0 ? 1 : -1;
};
