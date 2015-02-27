/**
 * Created by Jerry Fu on 2/6/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.TelemetryManager = function()
{
    this._initializeSDK();

    this.attemptsOnLastProblem = 0;

    this.ordersCompleted = 0;

    this.challengesCompleted = 0;
    this.challengesCompletedOnFirstAttempt = 0;
    this.challengeLatencySum = 0;

    this.penResizes = [];

    //GlassLabSDK.setOptions({gameLevel: "measure_window_a3"});

    // FIXME: These may not be that useful. A level is currently connected to a day but we care more about challenges
    GlassLab.SignalManager.levelLoaded.add(this._onLevelLoaded, this);
    GlassLab.SignalManager.levelWon.add(this._onLevelWon, this);
    GlassLab.SignalManager.levelLost.add(this._onLevelLost, this);

    GlassLab.SignalManager.feedingPenResolved.add(this._onFeedingPenResolved, this);
    GlassLab.SignalManager.penResized.add(this._onFeedingPenResized, this);
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

    GlassLabSDK.setOptions( {
        gameId: "PRIMA",
        gameVersion: "0.2.1",
        gameLevel: "Ben 'Pinnacle of Rage' Dapkiewicz"
    } );

    // Manually set local logging for the SDK
    GlassLabSDK.setOptions( { localLogging: true, dispatchQueueUpdateInterval: 500 } );

    // Turn on console logging
    GlassLabSDK.displayLogs();

    // Attempt to connect to the server.
    GlassLabSDK.connect( "PRIMA", "http://stage.playfully.org", function( data ) {
        console.log( "[GlassLabSDK] Connection successful: " + data );

        GlassLabSDK.getUserInfo(function( data ){
            console.log("[GlassLabSDK] Get User Info Successful: "+data);

            GlassLabSDK.startSession();
        }, function( data ){
            console.log("[GlassLabSDK] Get User Info Failed: "+data);
        });
    }, function( data ) {
        console.error( "[GlassLabSDK] FAILURE! Connection failed: " + data );
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

GlassLab.TelemetryManager.prototype._onFeedingPenResized = function(pen, prevDimensions, newDimensions)
{
    if (!this.penResizes.length) this.originalPenDimensions = prevDimensions;

    this.penResizes.push(newDimensions);
};


GlassLab.TelemetryManager.prototype._onChallengeStarted = function(id, problemType, challengeType)
{
    this.currentChallengeId = id;
    this.currentProblemType = problemType;
    this.currentChallengeType = challengeType;
    this.challengeAttempts = 0;
    this.challengeOriginalStartTime = GLOBAL.game.time.now;
    this.challengeAttemptStartTime = GLOBAL.game.time.now;
    this.feedingPenResizes = [];

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
    this.feedingPenResizes = [];

    GlassLabSDK.saveTelemEvent("restart_challenge", {});
};

GlassLab.TelemetryManager.prototype._onChallengeComplete = function()
{
    var latency = (GLOBAL.game.time.now - this.challengeOriginalStartTime) / 1000;
    GlassLabSDK.saveTelemEvent("complete_challenge", {
        problem_type: this.currentProblemType,
        challenge_type: this.currentChallengeType,
        attempt_count: this.challengeAttempts,
        total_latency: latency
    });

    if (this.currentChallengeType == "pen") {
        var steps = this.penResizes.length;
        var data = { pen_dimensions: this.penResizes[steps-1], challenge_type: this.currentChallengeType };
        if (steps == 1) {
            GlassLabSDK.saveTelemEvent("solve_in_1_step", data);
        } else {
            data.step_count = steps;
            GlassLabSDK.saveTelemEvent("solve_in_n_steps", data);
        }

        GlassLabSDK.saveTelemEvent("first_3_moves", {
            pen_dimensions0: this.originalPenDimensions || "",
            pen_dimensions1: this.penResizes[0] || "",
            pen_dimensions2: this.penResizes[1] || "",
            pen_dimensions3: this.penResizes[2] || ""
        });
    }

    this.challengesCompleted ++;
    if (this.challengeAttempts == 1) this.challengesCompletedOnFirstAttempt ++;
    GlassLabSDK.saveTelemEvent("proportion_completed_on_first_attempt", {
        value: this.challengesCompletedOnFirstAttempt / this.challengesCompleted
    });

    this.challengeLatencySum += latency;
    GlassLabSDK.saveTelemEvent("mean_challenge_latency", {
        value: this.challengeLatencySum / this.challengesCompleted
    });
};

