/**
* The Loading State is going to be used to load in all of the in-game assets that we need in game.
*
* Because in this blueprint there is only a single "hidden object" section we are going to load in all of 
* the asset's at this point.
*
* If you have multiple states however, I would recommend have loading the other graphics as they are required by their states, 
* Otherwise the loading times maybe a bit long and it is not the most optimal solution.
*
*/

/**
* Since we want to use the custom Kiwi.JS loader with the bobing kiwi/html5 logo and everything. We need to extend the KiwiLoadingScreen State.  
* The KiwiLoadingScreen State is an extentsion of a normal State but it has some custom code to handle the loading/bobbing/fading of all the items, so if you override a method (like the preload) for example just make sure you call the super method.
* 
* The parameters we are passing into this method are as ordered.
* 1 - name {String} Name of this state.
* 2 - stateToSwitch {String} Name of the state to switch to AFTER all the assets have loaded. Note: The state you want to switch to should already have been added to the game.
* 3 - dimensions {Object} A Object containing the width/height that the game is to be. For example {width: 1024, height: 768}
* 4 - subfolder {String} The folder that the loading graphics are located at. 
*/
var LoadingState = new KiwiLoadingScreen('LoadingState','IntroState',{width:500,height: 500}, 'assets/img/loading/');

LoadingState.preload = function () {
    
    //Make sure to call the super at the top.
    //Otherwise the loading graphics will load last, and that defies the whole point in loading them. 
    KiwiLoadingScreen.prototype.preload.call(this);

    //this.addSpriteSheet('gems', 'assets/img/gems.png', 40, 40);
    this.addSpriteSheet('gems', 'assets/img/numberTiles2.png', 60, 60);
    this.addSpriteSheet('gemsHighlight', 'assets/img/numberTiles2_highlight.png', 60, 60);
		/*
    this.addSpriteSheet('numbers', 'assets/img/numbers.png', 36, 70);
    this.addImage('tile', 'assets/img/mathyMatch_prototype1_numberTile_default.png');
    this.addImage('tile_highlight', 'assets/img/mathyMatch_prototype1_numberTile_highlight.png');
    */


};
