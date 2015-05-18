/**
 * Created by Rose Abernathy on 5/18/2015.
 */

var GlassLab = GlassLab || {};
GlassLab.State = GlassLab.State || {};

GlassLab.State.Boot = function (game) {};

GlassLab.State.Boot.prototype.preload = function () {
    //  Here we load the assets required for our preloader (in this case a background and a loading bar)
    this.load.image('loadingFill', 'assets/images/main_menu/loading/loading_fill.png');
    this.load.image('loadingSpinner', 'assets/images/main_menu/loading/loading_spinner.png');
    this.load.image('loadingStatic', 'assets/images/main_menu/loading/loading_static.png');
};

GlassLab.State.Boot.prototype.create = function () {
    //  By this point the preloader assets have loaded to the cache, so now let's start the real preloader going
    this.state.start('Init');
};
