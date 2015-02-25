/**
 * Created by Jerry Fu on 2/6/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.TelemetryManager = function()
{
    this._initializeSDK();

    this.attemptsOnLastProblem = 0;

    this.ordersCompleted = 0;

    //GlassLabSDK.setOptions({gameLevel: "measure_window_a3"});

    // FIXME: These may not be that useful. A level is currently connected to a day but we care more about challenges
    GlassLab.SignalManager.levelLoaded.add(this._onLevelLoaded, this);
    GlassLab.SignalManager.levelWon.add(this._onLevelWon, this);
    GlassLab.SignalManager.levelLost.add(this._onLevelLost, this);

    GlassLab.SignalManager.feedingPenResolved.add(this._onFeedingPenResolved, this);
    GlassLab.SignalManager.orderCompleted.add(this._onOrderCompleted, this);

    GlassLab.SignalManager.challengeStarted.add(this._onChallengeStarted, this);
};

GlassLab.TelemetryManager.prototype._initializeSDK = function()
{
    // First check if the GlassLab SDK object is even defined.
    if( typeof GlassLabSDK == "undefined" ) {
        console.error( "[GlassLab SDK] The SDK is unavailable!" );
        return;
    }

    // Manually set local logging for the SDK
    GlassLabSDK.setOptions( { localLogging: true, dispatchQueueUpdateInterval: 500 } );

    // Turn on console logging
    GlassLabSDK.displayLogs();

    // Attempt to connect to the server. Set the URI if the host is not playfully.org
    // TODO: check if the host is playfully.org and ignore setting the URI
    GlassLabSDK.connect( "TEST", "http://dev.playfully.org:8001", function( data ) {
        console.log( "[GlassLab SDK] Connection successful: " + data );
        _this._sdk_connection_state = _this.sdkConnectionState.active;
    }, function( data ) {
        console.log( "[GlassLab SDK] FAILURE! Connection failed: " + data );
        _this._sdk_connection_state = _this.sdkConnectionState.failed;
    });
};

GlassLab.TelemetryManager.prototype._onLevelLoaded = function(level)
{
    this.attemptsOnLastProblem = 0;
    this.ordersCompleted = 0;

    GlassLabSDK.startSession();
};

GlassLab.TelemetryManager.prototype._onLevelWon = function()
{
};

GlassLab.TelemetryManager.prototype._onOrderCompleted = function(order)
{
    this.ordersCompleted++;
    console.log("Orders completed: "+this.ordersCompleted);
};

GlassLab.TelemetryManager.prototype._onLevelLost = function()
{
    this.attemptsOnLastProblem++;
    console.log("Attempts: "+this.attemptsOnLastProblem);
};

GlassLab.TelemetryManager.prototype._onFeedingPenResolved = function(pen, success)
{
    console.log("Feeding pen resolved");
    this._onChallengeAnswered(success);
    // TODO: There are more complications like whether enough creatures were in the pen.
    // This whole structure is weird. The telemetry manager shouldn't be making decisions about what's a success or failure.
};


GlassLab.TelemetryManager.prototype._onChallengeStarted = function(id, problemType, challengeType)
{
    this.currentChallengeId = id;
    this.currentProblemType = problemType;
    this.currentChallengeType = challengeType;
    this.challengeAttempts = 0;
    this.challengeOriginalStartTime = GLOBAL.game.time.now;
    this.challengeAttemptStartTime = GLOBAL.game.time.now;

    GlassLabSDK.saveTelemEvent("start_challenge", {problem_type: problemType, challenge_type: challengeType});
};

GlassLab.TelemetryManager.prototype._onChallengeAnswered = function(success)
{
    this.challengeAttempts ++;

    GlassLabSDK.saveTelemEvent("submit_answer", {
        problem_type: this.currentProblemType,
        challenge_type: this.currentChallengeType,
        success: success,
        attempt_count: this.challengeAttempts,
        latency: (GLOBAL.game.time.now - this.challengeAttemptStartTime) / 1000
    });

    // This should align correctly, but if not we'll need to hook up these functions to their own events
    if (success) this._onChallengeComplete();
    else this._onChallengeRestarted();
};

GlassLab.TelemetryManager.prototype._onChallengeRestarted = function()
{
    this.challengeAttemptStartTime = GLOBAL.game.time.now;

    GlassLabSDK.saveTelemEvent("restart_challenge", {});
};

GlassLab.TelemetryManager.prototype._onChallengeComplete = function()
{
    GlassLabSDK.saveTelemEvent("complete_challenge", {
        problem_type: this.currentProblemType,
        challenge_type: this.currentChallengeType,
        attempt_count: this.challengeAttempts,
        total_latency: (GLOBAL.game.time.now - this.challengeOriginalStartTime) / 1000
    });
};

