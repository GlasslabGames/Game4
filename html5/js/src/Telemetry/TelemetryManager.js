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
    this.SOWOs = {};
    this.problemTypesCompletedPerfectly = {}; // problem types are added to this list when a player completes a problem of that type in 1 attempt
    this.problemTypesFailedTwiceCount = {}; // count of how many problems of each type the player has failed at least twice.

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
    GlassLabSDK.hideLogs(); //displayLogs();

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


GlassLab.TelemetryManager.prototype._onChallengeStarted = function(id, challengeType, problemType)
{
    // These things should be set whether we're starting a new challenge or just restarting
    this.challengeAttemptStartTime = GLOBAL.game.time.now;
    this.penResizes = [];

    if (this.currentChallengeId == id) return; // if we're just restarting, don't send the telemetry or reset anything else

    this.currentChallengeId = id;
    this.currentChallengeType = challengeType;
    this.currentProblemType = problemType;
    this.challengeOriginalStartTime = GLOBAL.game.time.now;

    GlassLabSDK.saveTelemEvent("start_challenge", {challenge_type: challengeType, problemType: problemType});
};

GlassLab.TelemetryManager.prototype._onChallengeComplete = function(success)
{
    // we submitted the answer, so increment the number of attempts
    var attempts = this.challengeAttempts[this.currentChallengeId] || 0;
    attempts ++;
    this.challengeAttempts[this.currentChallengeId] = attempts;

    GlassLabSDK.saveTelemEvent("submit_answer", {
        challenge_type: this.currentChallengeType,
        problem_type: this.currentProblemType,
        success: success,
        attempt_count: attempts,
        latency: (GLOBAL.game.time.now - this.challengeAttemptStartTime) / 1000
    });

    if (success) this._onChallengeSuccess();
    else this._onChallengeFailure();

    this._saveData();
};

GlassLab.TelemetryManager.prototype._onChallengeFailure = function()
{
    GlassLabSDK.saveTelemEvent("fail_challenge", {
        challenge_type: this.currentChallengeType,
        problem_type: this.currentProblemType
    });

    this._checkFailureSOWOs(this.currentChallengeId, this.challengeAttempts[this.currentChallengeId], this.currentChallengeType, this.currentProblemType);
};

GlassLab.TelemetryManager.prototype._onChallengeSuccess = function()
{
    var latency = (GLOBAL.game.time.now - this.challengeOriginalStartTime) / 1000;
    GlassLabSDK.saveTelemEvent("complete_challenge", {
        challenge_type: this.currentChallengeType,
        problem_type: this.currentProblemType,
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

    this._checkSuccessSOWOs(this.currentChallengeId, this.challengeAttempts[this.currentChallengeId], this.currentChallengeType, this.currentProblemType);
};

GlassLab.TelemetryManager.prototype._checkSuccessSOWOs = function(challengeId, attempts, challengeType, problemType) {
    var problemType = problemType.substring(problemType.length - 3).toUpperCase(); // make sure to update this if the problem type format changes
    var lastIntroChallengeId = "0.04."; // FIXME if we change the level IDs
    var lastPart2ChallengeId = "2.05.";

    var perfectProgressions = {};
    for (var id in this.challengeAttempts) {
        var section = parseInt(id.split(".")[0]); // make sure to update this if the challenge ID format changes
        if (section in perfectProgressions) {
            perfectProgressions[section] = perfectProgressions[section] && (this.challengeAttempts[id] == 1);
        } else {
            perfectProgressions[section] = (this.challengeAttempts[id] == 1);
        }
    }
    if (challengeId.indexOf(lastIntroChallengeId) != -1 && perfectProgressions[0]) this._sendSOWO("so1"); // all intro levels were successful on the 1st attempt

    if (challengeType == "pen") this._sendSOWO("so2"); // first successful pen (it will only be sent if it hasn't been sent yet.)
    else if (challengeType == "order") this._sendSOWO("so3"); // first successful order

    if (attempts == 1) {
        if (!this.problemTypesCompletedPerfectly[problemType]) {
            this.problemTypesCompletedPerfectly[problemType] = true;
            // the following SOs will be sent as soon as the player completes at least one problem of the specifies types perfectly
            if (this.problemTypesCompletedPerfectly.MF && this.problemTypesCompletedPerfectly.NF) this._sendSOWO("so4");
            if (this.problemTypesCompletedPerfectly.MC && this.problemTypesCompletedPerfectly.NC) this._sendSOWO("so5");
            if (this.problemTypesCompletedPerfectly.MT) this._sendSOWO("so6");
        }
    }

    if (challengeId.indexOf(lastPart2ChallengeId) != -1 && perfectProgressions[1] && perfectProgressions[2]) this._sendSOWO("so7"); // all challenges in parts 1 and 2 were completed in 1 attempt

    if (problemType == "MT") this._sendSOWO("so8"); // the player has completed an advanced challenge (in any number of attempts)

    var section = parseInt(challengeId.split(".")[0]);
    if (section > 0) { // we need to track these for wo2 and 3
        if (challengeType == "pen") this.pastFirstNonIntroPenChallenge = true;
        else if (challengeType == "order") this.pastFirstNonIntroOrderChallenge = true;
        // Once we've won one of these challenges that's not in the intro, we can no longer trigger watch-outs that target the first non-intro challenge.
    }
};

GlassLab.TelemetryManager.prototype._checkFailureSOWOs = function(challengeId, attempts, challengeType, problemType) {
    var section = challengeId.split(".")[0]; // make sure to update this if the challenge ID format changes
    if (section == "0") {
        if (attempts == 3) this._sendSOWO("wo1"); // more than 3 attempts to complete an intro challenge
    } else if (attempts == 4) {
        if (challengeType == "order" && !this.pastFirstNonIntroOrderChallenge) this._sendSOWO("wo2"); // more than 4 attempts for the first order challenge (they haven't beaten one before)
        else if (challengeType == "pen" && !this.pastFirstNonIntroPenChallenge) this._sendSOWO("wo3"); // more than 4 attempts for the first pen challenge (they haven't beaten one before)
    }

    if (attempts == 2) { // note that we only want to increment the count when the attempt is 2 and not do it again when > 2
        var problemType = problemType.substring(problemType.length - 3).toUpperCase(); // make sure to update this if the problem type format changes
        this.problemTypesFailedTwiceCount[problemType] = this.problemTypesFailedTwiceCount[problemType] || 0;
        this.problemTypesFailedTwiceCount[problemType] ++;
        if (this.problemTypesFailedTwiceCount[problemType] >= 2) {
            if (problemType == "NF") this._sendSOWO("wo4");
            else if (problemType == "MF") this._sendSOWO("wo5");
            else if (problemType == "MC") this._sendSOWO("wo6");
            else if (problemType == "NC") this._sendSOWO("wo7");
            else if (problemType == "MT") this._sendSOWO("wo8");
        }
    }
};

GlassLab.TelemetryManager.prototype._sendSOWO = function(name) {
    if (!this.SOWOs[name]) { // only send a SOWO if we haven't sent it yet
        this.SOWOs[name] = true;
        console.log("***",name,"***");
        GlassLabSDK.saveTelemEvent(name, {});
    }
};

GlassLab.TelemetryManager.prototype._saveData = function() {
    GLOBAL.saveManager.SaveData("telemetryData", {
        challengesCompleted: this.challengesCompleted,
        challengesCompletedOnFirstAttempt: this.challengesCompletedOnFirstAttempt,
        challengeLatencySum: this.challengeLatencySum,
        challengeAttempts: this.challengeAttempts,
        SOWOs: this.SOWOs,
        problemTypesCompletedPerfectly: this.problemTypesCompletedPerfectly,
        problemTypesFailedTwiceCount: this.problemTypesFailedTwiceCount,
        pastFirstNonIntroPenChallenge: this.pastFirstNonIntroPenChallenge,
        pastFirstNonIntroOrderChallenge: this.pastFirstNonIntroOrderChallenge
    });
};

GlassLab.TelemetryManager.prototype._loadData = function() {
    if (GLOBAL.saveManager.HasData("telemetryData")) {
        var data = GLOBAL.saveManager.LoadData("telemetryData");
        for (var key in data) {
            this[key] = data[key];
        }
    }
};
