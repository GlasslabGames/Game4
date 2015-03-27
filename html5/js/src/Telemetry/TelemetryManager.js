/**
 * Created by Jerry Fu on 2/6/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.TelemetryManager = function()
{
    this.initialized = false;
    this._initializeSDK();

    this.attemptsOnLastProblem = 0;

    this.ordersCompleted = 0;

    this.challengesCompleted = 0;
    this.challengesCompletedOnFirstAttempt = 0;
    this.challengeLatencySum = 0;

    this.userSaveString = "{}";

    this.penResizes = [];
    this.challengeAttempts = {}; // challenge attempts by challengeID. We should be good to erase these when they go to the next level.

    GlassLab.SignalManager.challengeStarted.add(this._onChallengeStarted, this);
    GlassLab.SignalManager.challengeComplete.add(this._onChallengeComplete, this);

    GlassLab.SignalManager.penResized.add(this._onFeedingPenResized, this); // needed to track pen resizes

    GlassLab.SignalManager.gameInitialized.addOnce(this._loadData, this);
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
        gameVersion: "0.2.2",
        gameLevel: ""
    } );

    // Manually set local logging for the SDK
    var hasServer = getParameterByName("telemetry") != "false" && (getParameterByName("sdkURL") != "" || location.hostname.indexOf("playfully.org") != -1);
    //var hasServer = true; // Baked for stage builds
    GlassLabSDK.setOptions( { localLogging: !hasServer, dispatchQueueUpdateInterval: 500 } );

    // Turn on console logging
    GlassLabSDK.displayLogs();

    if (GlassLabSDK.getOptions().localLogging)
    {
        this.initialized = true;
    }
    else
    {
        // Attempt to connect to the server.
        var connectURL = getParameterByName("sdkURL") || "http://stage.playfully.org";
        GlassLabSDK.connect( "PRIMA", connectURL, function( data ) {
            console.log( "[GlassLabSDK] Connection successful: " + data );

            GlassLabSDK.getUserInfo(
                function( data ){
                    console.log("[GlassLabSDK] Get User Info Successful: "+data);
                    GlassLabSDK.getSaveGame(
                        function(data) {
                            console.log("[GlassLabSDK] Get Save Game - Load Success", data);
                            this.userSaveString = data;

                            this.initialized = true
                        }.bind(this),
                        function(data) {
                            var dataObj = JSON.parse(data);
                            if (dataObj.key && dataObj.key == "no.data")
                            {
                                this.initialized = true
                            }
                            else
                            {
                                console.error("Failure", data);
                            }
                        }.bind(this)
                    );
                }.bind(this),
                function( data ){
                    console.log("[GlassLabSDK] Get User Info Failed: "+data);
                }.bind(this)
            );
        }.bind(this), function( data ) {
            console.error( "[GlassLabSDK] FAILURE! Connection failed: " + data );
        }.bind(this));
    }
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


GlassLab.TelemetryManager.prototype._onFeedingPenResized = function(pen, prevDimensions, newDimensions)
{
    if (!this.penResizes.length) this.originalPenDimensions = prevDimensions;

    if (prevDimensions != newDimensions) this.penResizes.push(newDimensions);
};


GlassLab.TelemetryManager.prototype._onChallengeStarted = function(id, challengeType)
{
    console.log("_onChallengeStarted",id,this.currentChallengeId);

    // These things should be set whether we're starting a new challenge or just restarting
    this.challengeAttemptStartTime = GLOBAL.game.time.now;
    this.penResizes = [];

    if (this.currentChallengeId == id) return; // if we're just restarting, don't send the telemetry or reset anything else

    this.currentChallengeId = id;
    this.currentChallengeType = challengeType;
    this.challengeOriginalStartTime = GLOBAL.game.time.now;

    GlassLabSDK.saveTelemEvent("start_challenge", {challenge_type: challengeType});
};

GlassLab.TelemetryManager.prototype._onChallengeComplete = function(success)
{
    // we submitted the answer, so increment the number of attempts
    var attempts = this.challengeAttempts[this.currentChallengeId] || 0;
    attempts ++;
    this.challengeAttempts[this.currentChallengeId] = attempts;

    this._saveData();

    GlassLabSDK.saveTelemEvent("submit_answer", {
        challenge_type: this.currentChallengeType,
        success: success,
        attempt_count: attempts,
        latency: (GLOBAL.game.time.now - this.challengeAttemptStartTime) / 1000
    });

    if (success) this._onChallengeSuccess();
    else this._onChallengeFailure();
};

GlassLab.TelemetryManager.prototype._onChallengeFailure = function()
{
    GlassLabSDK.saveTelemEvent("fail_challenge", {});
};

GlassLab.TelemetryManager.prototype._onChallengeSuccess = function()
{
    var latency = (GLOBAL.game.time.now - this.challengeOriginalStartTime) / 1000;
    GlassLabSDK.saveTelemEvent("complete_challenge", {
        challenge_type: this.currentChallengeType,
        attempt_count: this.challengeAttempts[this.currentChallengeId],
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
    if (this.challengeAttempts[this.currentChallengeId] == 1) this.challengesCompletedOnFirstAttempt ++;
    GlassLabSDK.saveTelemEvent("proportion_completed_on_first_attempt", {
        value: this.challengesCompletedOnFirstAttempt / this.challengesCompleted
    });

    this.challengeLatencySum += latency;
    GlassLabSDK.saveTelemEvent("mean_challenge_latency", {
        value: this.challengeLatencySum / this.challengesCompleted
    });

    this._saveData();
};

GlassLab.TelemetryManager.prototype._saveData = function() {
    GLOBAL.saveManager.SaveData("telemetryData", {
        challengesCompleted: this.challengesCompleted,
        challengesCompletedOnFirstAttempt: this.challengesCompletedOnFirstAttempt,
        challengeLatencySum: this.challengeLatencySum,
        challengeAttempts: this.challengeAttempts
    });
};

GlassLab.TelemetryManager.prototype._loadData = function() {
    if (GLOBAL.saveManager.HasData("telemetryData")) {
        var data = GLOBAL.saveManager.LoadData("telemetryData");
        this.challengesCompleted = data.challengesCompleted;
        this.challengesCompletedOnFirstAttempt = data.challengesCompletedOnFirstAttempt;
        this.challengeLatencySum = data.challengeLatencySum;
        this.challengeAttempts = data.challengeAttempts;
    }
};
