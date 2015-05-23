/**
 * Created by Jerry Fu on 2/6/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.TelemetryManager = function()
{
    this.initialized = false;
    this._initializeSDK();

    this._resetData();

    this.userSaveString = "{}";

    GlassLab.SignalManager.challengeStarted.add(this._onChallengeStarted, this);
    GlassLab.SignalManager.challengeComplete.add(this._onChallengeComplete, this);

    GlassLab.SignalManager.penResized.add(this._onFeedingPenResized, this); // needed to track pen resizes

    GlassLab.SignalManager.gameInitialized.addOnce(this._loadData, this);
    GlassLab.SignalManager.gameReset.addOnce(this._resetData, this);
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
        gameVersion: GLOBAL.version,
        gameLevel: ""
    } );

    // Manually set local logging for the SDK
    var hasServer = getParameterByName("telemetry") != "false" && (getParameterByName("sdkURL") != "" || location.hostname.indexOf("playfully.org") != -1);
    //var hasServer = true; // Baked for stage builds
    GlassLabSDK.setOptions( { localLogging: !hasServer, dispatchQueueUpdateInterval: 500 } );

    if (GlassLabSDK.getOptions().localLogging)
    {
        // Turn on console logging
        GlassLabSDK.hideLogs(); //displayLogs();

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

GlassLab.TelemetryManager.prototype.getCurrentChallengeAttempts = function() {
    return this.challengeAttempts[this.currentChallengeId];
};

GlassLab.TelemetryManager.prototype._onFeedingPenResized = function(pen, prevDimensions, newDimensions)
{
    if (!this.penResizes.length) this.originalPenDimensions = prevDimensions;

    if (prevDimensions != newDimensions) this.penResizes.push(newDimensions);
};


GlassLab.TelemetryManager.prototype._onChallengeStarted = function(id, challengeType, problemType, boss, creatureType)
{
    // These things should be set whether we're starting a new challenge or just restarting
    this.challengeAttemptStartTime = GLOBAL.game.time.now;
    this.penResizes = [];

    if (this.currentChallengeId == id) return; // if we're just restarting, don't send the telemetry or reset anything else

    this.currentChallengeId = id;
    this.currentChallengeType = challengeType;
    this.currentProblemType = problemType;
    this.challengeOriginalStartTime = GLOBAL.game.time.now;
    this.currentCreatureType = creatureType;

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

    this._checkFailureSOWOs(this.currentChallengeId, this.challengeAttempts[this.currentChallengeId], this.currentChallengeType, this.currentProblemType, this.currentCreatureType);
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

    this._checkSuccessSOWOs(this.currentChallengeId, this.challengeAttempts[this.currentChallengeId], this.currentChallengeType, this.currentProblemType, this.currentCreatureType);
};

// 3BR2MTb -> MTb, 2UR1MC -> MC -- make sure to update if the problem type changes
GlassLab.TelemetryManager.prototype._extractProblemType = function(problemType) {
    var index = problemType.search(/\D+\b/); // find the final sequence of non-digits in the string
    //console.log("SOWO problem type:",problemType.substring(index),"from",problemType);
    return problemType.substring(index); // make sure to update this if the problem type format changes
};

GlassLab.TelemetryManager.prototype._checkSuccessSOWOs = function(challengeId, attempts, challengeType, problemType, creatureType) {
    problemType = this._extractProblemType(problemType);
    var lastIntroChallengeId = "T1.05";
    var lastPart2ChallengeId = "2.06b";

    // compile a list of the sections (T, 1, 2, etc) in which the player finished every challenge on the first attempt
    var perfectProgressions = {};
    for (var id in this.challengeAttempts) {
        var section = id[0]; // make sure to update this if the challenge ID format changes
        if (section in perfectProgressions) {
            perfectProgressions[section] = perfectProgressions[section] && (this.challengeAttempts[id] == 1); // stays true as long as the number of attempts is 1
        } else {
            perfectProgressions[section] = (this.challengeAttempts[id] == 1);
        }
    }
    if (challengeId == lastIntroChallengeId && perfectProgressions["T"]) this._sendSOWO("so1"); // reached the last intro challenge with all tutorial levels successful on the 1st attempt

    if (challengeType == "pen") this._sendSOWO("so2"); // first successful pen (it will only be sent if it hasn't been sent yet.)
    else if (challengeType == "order") this._sendSOWO("so3"); // first successful order

    // Check for some SO that are sent when we've completed certain combinations of problems on the first try
    if (attempts == 1 && problemType.length <= 4) { // exclude odd problem types
        var completed = this.problemTypesCompletedPerfectly;

        // the categories are "baby", "adult", and "bird".
        if (creatureType && (problemType.charAt(1) != "T" || problemType.charAt(2) != "c")) { // don't count Tc pro8blemTypes
            var category = "adult";
            if (creatureType.indexOf("bird") > -1) category = "bird";
            else if (creatureType.indexOf("baby") > -1) category = "baby";

            category += problemType.charAt(1); // append the second letter of the problem type (F, C, T)
            //console.log("SOWO category:",category);

            completed[category] = true; // add the creature/problem type key (babyC, adultT, etc)

            if (completed.babyC && completed.babyF) this._sendSOWO("so4");
            if (completed.adultC && completed.adultT) this._sendSOWO("so5"); // no adultF because that problem type isn't present in the progression
            if (completed.birdC && completed.birdF && completed.birdT) this._sendSOWO("so9");
        }

        completed[problemType] = true;
        if (completed.MTa && completed.MTb) this._sendSOWO("so6");
    }

    if (challengeId == lastPart2ChallengeId && perfectProgressions["1"] && perfectProgressions["2"]) this._sendSOWO("so7"); // all challenges in parts 1 and 2 were completed in 1 attempt

    if (problemType == "MTa" || problemType == "MTb") this._sendSOWO("so8"); // the player has completed an advanced challenge (in any number of attempts)

    if (challengeId[0] != "T") { // we need to track these for wo2 and 3
        if (challengeType == "pen") this.pastFirstNonIntroPenChallenge = true;
        else if (challengeType == "order") this.pastFirstNonIntroOrderChallenge = true;
        // Once we've won one of these challenges that's not in the intro, we can no longer trigger watch-outs that target the first non-intro challenge.
    }

    if (challengeId == lastIntroChallengeId) this.finishedIntro = true; // once they pass the last intro challenge, they can no longer trigger wo1
};

GlassLab.TelemetryManager.prototype._checkFailureSOWOs = function(challengeId, attempts, challengeType, problemType, creatureType) {
    problemType = this._extractProblemType(problemType);

    if (challengeId[0] == "T") { // tutorial challenge
        if (attempts == 3 && !this.finishedIntro) this._sendSOWO("wo1"); // more than 3 attempts to complete a tutorial challenge (before finishing the intro)
    } else if (attempts == 4) {
        if (challengeType == "order" && !this.pastFirstNonIntroOrderChallenge) this._sendSOWO("wo2"); // more than 4 attempts for the first order challenge (they haven't beaten one before)
        else if (challengeType == "pen" && !this.pastFirstNonIntroPenChallenge) this._sendSOWO("wo3"); // more than 4 attempts for the first pen challenge (they haven't beaten one before)
    }

    // Count up how many problems of each category they've failed twice, not counting tutorial challenges
    if (attempts == 2 && creatureType && challengeId[0] != "T") {
        // note that we only want to increment the count when the attempt is 2 and not do it again when > 2

        var category = "adult";
        if (creatureType.indexOf("bird") > -1) category = "bird";
        else if (creatureType.indexOf("baby") > -1) category = "baby";

        category += problemType[1]; // append the second letter of the problem type (F, C, T)
        //console.log("SOWO category:",category);

        this.problemTypesFailedTwiceCount[category] = this.problemTypesFailedTwiceCount[category] || 0;
        this.problemTypesFailedTwiceCount[category] ++;
        if (this.problemTypesFailedTwiceCount[category] >= 2) {
            switch (category) {
                case "babyC":   this._sendSOWO("wo4"); break;
                case "babyF":   this._sendSOWO("wo5"); break;
                case "adultC":  this._sendSOWO("wo6"); break;
                case "adultF":  this._sendSOWO("wo7"); break;
                case "adultT":  this._sendSOWO("wo8"); break;
                case "birdC":   this._sendSOWO("wo9"); break;
                case "birdF":   this._sendSOWO("wo10"); break;
                case "birdT":   this._sendSOWO("wo11"); break;
            }
        }
    }
};

GlassLab.TelemetryManager.prototype._sendSOWO = function(name) {
    if (!this.SOWOs[name]) { // only send a SOWO if we haven't sent it yet
        //console.log("*** Saving SOWO:",name,"***");
        this.SOWOs[name] = true;
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
        pastFirstNonIntroOrderChallenge: this.pastFirstNonIntroOrderChallenge,
        finishedIntro: this.finishedIntro
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

GlassLab.TelemetryManager.prototype._resetData = function() {
    this.challengesCompleted = 0;
    this.challengesCompletedOnFirstAttempt = 0;
    this.challengeLatencySum = 0;

    this.penResizes = [];
    this.challengeAttempts = {}; // challenge attempts by challengeID. We should be good to erase these when they go to the next level.
    this.SOWOs = {};
    this.problemTypesCompletedPerfectly = {};
    this.problemTypesFailedTwiceCount = {};

    this.pastFirstNonIntroPenChallenge = false;
    this.pastFirstNonIntroOrderChallenge = false;
    this.finishedIntro = false;
};
