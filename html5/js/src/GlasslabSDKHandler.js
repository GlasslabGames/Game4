/**
 * Created by Jerry Fu on 2/6/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.GlasslabSDKHandler = function()
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
    GlassLabSDK.connect( "TEST", "http://127.0.0.1:8001", function( data ) {
        console.log( "[GlassLab SDK] Connection successful: " + data );
        _this._sdk_connection_state = _this.sdkConnectionState.active;
    }, function( data ) {
        console.log( "[GlassLab SDK] FAILURE! Connection failed: " + data );
        _this._sdk_connection_state = _this.sdkConnectionState.failed;
    });

    GlassLabSDK.setOptions({gameLevel: "measure_window_a3"});
    GlassLabSDK.startSession();
};

