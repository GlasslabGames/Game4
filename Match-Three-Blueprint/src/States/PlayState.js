var PlayState = new Kiwi.State('PlayState');

/**
* The PlayState in the core state that is used in the game. 
*
* It is the state where majority of the functionality occurs 'in-game' occurs.
* 
*
* @class playState
* @extends State
* @constructor
*/


/**
* This create method is executed when Kiwi Game reaches the boot stage of the game loop.
* @method create
* @public
*/
PlayState.create = function () {
    /**
    * Create your randomized board.
    */
    this.gemCount = 16;
    this.tileSize = 60;
    this.height = 7;
    this.width = 7;
    this.matchesCleared = 0;
    this.animating = false;
    this.step = 5;
    this.clearedOriginalBoard = false;
    this.score = 0;
    //Total matches per turn
    this.totalMatchesCleared = 0;

    this.startX = 0;
    this.startY = 0;

    this.targetNumber = 2; // start with target number 2 (which focuses on multiples of 2)

    //////////////////
    //Enable swipe?
    this.enableSwipe = true;
    this.game.input.onUp.add(PlayState.clickTile, PlayState);
    if(this.enableSwipe)
        this.game.input.onDown.add(PlayState.clickTile, PlayState);

    this.pieces = [];
    for (var i = 0; i < this.height; i++) {
        this.pieces.push(new Array(this.width));
    };

    for (var y = 0; y < this.height; y++) {
        for (var x = 0; x < this.width; x++) {
            var digit = PlayState.getNewTileDigit();
            // var digit = Math.floor(Math.random() * PlayState.gemCount); // old totally random way
            var tempCreate = new Kiwi.GameObjects.Sprite(PlayState, PlayState.textures.gems, x * PlayState.tileSize + this.startX, y * PlayState.tileSize + this.startY);
            tempCreate.animation.switchTo(digit);
            tempCreate.my_x = x;
            tempCreate.my_y = y;
            //tempCreate.d_y = y;
            tempCreate.name = 'gem' + y + '_' + x;
            PlayState.addChild(tempCreate);
            tempCreate.animating = false;


            this.pieces[y][x] = tempCreate;
        };
    };
    this.curr = '';

    //Remove any matches created by randomization
    //this.clearMatches();
    this.clearOriginalMatches();
}


/**
* This method is continuoiusly executed. 
* @method update
* @public
* @param tile{Sprite} The current tile clicked.
*/
PlayState.update = function(){
    Kiwi.State.prototype.update.call(this);


    if(this.clearedOriginalBoard){
        this.moveTiles();
    } else {
        PlayState.clearOriginalMatches();
    }
    if(!this.animating){
        this.clearMatches();
        this.animating = true;
    }
}


/**
* This method is executed when a gem is clicked.
* @method clickTile
* @public
* @param tile{Sprite} The current tile clicked.
*/
PlayState.clickTile = function (mouseX, mouseY) {
    var tileX = 0;
    var tileY = 0;
    if(!this.clearedOriginalBoard){
        this.clearedOriginalBoard = !this.clearedOriginalBoard;
    }
    for(var i = 0; i < this.width; i++){
        if (mouseX - this.startX > this.tileSize * i && mouseX - this.startX < this.tileSize * (i + 1)) {
            tileX = i;
        }
    }

    for(var j = 0; j < this.height; j++){
        if (mouseY - this.startY > this.tileSize * j && mouseY - this.startY < this.tileSize * (j + 1)) {
            tileY = j;
        }
    }

    var tile = this.pieces[tileY][tileX];


    if (this.curr == '') {
        //Select your first tile
        this.curr = tile;
    } else if (this.curr == tile) {
        //Deselect current tile
        this.curr = '';
    } else {
        //need to check if the two are touching
        if (this.checkTouching(this.curr, tile)) {
            //switch tiles
            //Stores data in temp var
            var cf = this.curr;
            var tf = tile;

            var cmy_y = this.curr.my_y;
            var cmy_x = this.curr.my_x;
            var cname = this.curr.name;
            var cx = this.curr.x;
            var cy = this.curr.y;

            var tmy_y = tile.my_y;
            var tmy_x = tile.my_x;
            var tname = tile.name;
            var tx = tile.x;
            var ty = tile.y;

            this.curr.my_y = tmy_y; 
            this.curr.my_x = tmy_x;
            this.curr.name = tname;
            this.curr.x = tx;
            this.curr.y = ty;
            this.pieces[tmy_y][tmy_x] = this.curr;
            

            tile.my_y = cmy_y; 
            tile.my_x = cmy_x;
            tile.name = cname;
            tile.x = cx;
            tile.y = cy;
            this.pieces[cmy_y][cmy_x] = tile;

            this.totalMatchesCleared = 0;
            this.clearMatches();

            //reset if there are no matches
            if (this.totalMatchesCleared == 0) {
                //switches back
                this.curr.my_y = cmy_y; 
                this.curr.my_x = cmy_x;
                this.curr.name = cname;
                this.curr.x = cx;
                this.curr.y = cy;
                this.pieces[cmy_y][cmy_x] =this.curr;


                tile.my_y = tmy_y; 
                tile.my_x = tmy_x;
                tile.name = tname;
                tile.x = tx;
                tile.y = ty;
                this.pieces[tmy_y][tmy_x] = tile;
            }

            this.curr = '';
        } else {
            //Select new tile
            this.curr = tile;
        }
    }
}


/**
* This method returns whether two tiles are touching or not.
* @method checkTouching
* @public
* @param t1{Sprite} The first tile checked.
* @param t2{Sprite} The second tile checked.
*/
PlayState.checkTouching = function (t1, t2) {
    if (t1.my_x != t2.my_x && t1.my_y != t2.my_y) return false;
    var diffX = t2.my_x - t1.my_x;
    var diffY = t2.my_y - t1.my_y;
    if (diffX > 1) return false;
    if (diffX < -1) return false;
    if (diffY > 1) return false;
    if (diffY < -1) return false;
    return true;
}



/**
* Randomly choose the digit for a new tile. It should be 1/3 target, 1/3 another digit, and 1/3 factor
* @method getNewTileDigit
* @return digit{int}
* @public
*/
PlayState.getNewTileDigit = function () {
    var rand = Math.random() * 3;
    var multiplier = Math.floor(Math.random() * (this.gemCount / this.targetNumber));
    if (rand < 1) {
        console.log("Case 1, multiplier:",multiplier,"return:",multiplier);
        return multiplier; // case 1: a number that, when multiplied by the target, doesn't exceed the max tile
    } else if (rand < 2) {
        console.log("Case 2, multiplier:",multiplier,"return:",multiplier * this.targetNumber);
        return multiplier * this.targetNumber; // case 2: the product
    } else {
        console.log("Case 3, multiplier:",multiplier,"return:",this.targetNumber);
        return this.targetNumber; // case 3: the target number
    }
}



/**
* This method updates the game board after matches have been cleared, then clears any new matches.
* @method updateBoard
* @public
*/
PlayState.updateBoard = function () {
    for(var i=0; i<this.width; i++){
        var newCount = 0;
        for(var j=this.height-1; j>=0 ;j--){
            var tile = this.pieces[j][i];
            var lowestVisible = -1;
            if(!tile.visible){
                for (var k = tile.my_y - 1; k >= 0; k--) {
                    if (lowestVisible == -1) {
                        var aboveTile = this.pieces[k][i]; 
                        if (aboveTile.visible) {
                            lowestVisible = aboveTile;
                            break;
                        }
                    }
                }
                if (lowestVisible == -1) { // No visible tile above. Therefore randomize new one.
                    var myCounter = 0;
                    for(var l = 0; l < this.height; l++){
                        if(!this.pieces[l][i].visible){
                            myCounter ++;
                        }
                    }
                    newCount++;
                    var digit = PlayState.getNewTileDigit();
                    var tempTile = new Kiwi.GameObjects.Sprite(PlayState, PlayState.textures.gems, (tile.my_x * PlayState.tileSize) + this.startX, -((newCount) * PlayState.tileSize) + this.startY);
                    tempTile.animation.switchTo(digit);
                    tempTile.my_x = tile.my_x;
                    tempTile.my_y = tile.my_y;
                    tempTile.animating = true;
                    tempTile.name = 'gem' + tile.my_y  + '_' + tile.my_x;
                    PlayState.addChild(tempTile);

                    this.pieces[tile.my_y ][tile.my_x] = tempTile;

                    
                    
                } else { // Visible tile above. Therefore move it to lowest !visible

                    this.pieces[lowestVisible.my_y][lowestVisible.my_x] = tile;
                    var lowestVisibleY = lowestVisible.my_y;
                    var lowestVisibleName = lowestVisible.name;
                    lowestVisible.animating = true;
                    lowestVisible.my_y = tile.my_y;
                    lowestVisible.name = tile.name;
                    lowestVisible.x = tile.my_x * PlayState.tileSize + this.startX;
                    this.pieces[tile.my_y][tile.my_x] = lowestVisible;
                    tile.my_y = lowestVisibleY;
                    tile.name = lowestVisibleName;
                }
            }
        }

    }
}


/**
* This method turns any matching tiles invisible, then calls the updateBoard method to remove them
* @method clearMatches
* @public
*/
PlayState.clearMatches = function () {
    var matches = this.getMatches();

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        for (var j = 0; j < match.length; j++) {
            match[j].visible = false;
        }
    }

    PlayState.matchesCleared = matches.length;
    PlayState.updateScore(matches);
    
    PlayState.totalMatchesCleared += matches.length;
    if (PlayState.matchesCleared > 0) {
        PlayState.updateBoard();
    }
};

/**
* This method returns an array of matches, or false
* @method getMatches
* @public
*/
PlayState.getMatches = function () {
    var matches = [];

    for (var l in this.pieces) {
        var pieces = this.pieces[l];
        
        for (var i in pieces) {
            var piece = pieces[i];

            var matchesHorizontal = PlayState.getMatchesHorizontal(piece);
            if (matchesHorizontal.length >= 3) {
                matches.push(matchesHorizontal);
            }

            var matchesVertical = PlayState.getMatchesVertical(piece);
            if (matchesVertical.length >= 3) {
                matches.push(matchesVertical);
            }
        }
    }

    return matches;
};

/**
* Check whether these three pieces form a match
* @method isMatch
* @return isMatch{bool} 
* @public
*/
PlayState.isMatch = function (pieceA, pieceB, pieceC) {
    return (pieceA.animation.frameIndex * pieceB.animation.frameIndex == pieceC.animation.frameIndex) ||
            (pieceA.animation.frameIndex == pieceB.animation.frameIndex * pieceC.animation.frameIndex);
};

/**
* This method returns all matching tiles that are connected horizontally
* @method getMatchesHorizontal
* @public
* @param piece{Sprite}
* @return matches{Array}
*
PlayState.getMatchesHorizontal = function (piece) {
    var matches = [];
    matches.push(piece);
    for (var i = piece.my_x - 1; i >= 0; i--) {
        var t = this.pieces[piece.my_y][i]; 
        if (t.animation.frameIndex == piece.animation.frameIndex) {
            matches.push(t);
        } else {
            break;
        }
    }
    for (var i = piece.my_x + 1; i < this.width; i++) {
        var t = this.pieces[piece.my_y][i];
        if (t.animation.frameIndex == piece.animation.frameIndex) {
            matches.push(t);
        } else {
            break;
        }
    }
    return matches;
}
*/

/**
* This method returns any 3-tile horizontal match including this piece
* @method getMatchesHorizontal
* @public
* @param piece{Sprite}
* @return matches{Array}
*/
PlayState.getMatchesHorizontal = function (piece) {
    var matches = [];
    matches.push(piece); // adding this now is fine; if we don't find any other pieces, we'll discount a 1-piece match anyway.

    // Find nearby pieces: [A][B][X][C][D]
    var pieceA = (piece.my_x - 2 >= 0) && this.pieces[piece.my_y][piece.my_x - 2];
    var pieceB = (piece.my_x - 1 >= 0) && this.pieces[piece.my_y][piece.my_x - 1];
    var pieceC = (piece.my_x + 1 < this.width) && this.pieces[piece.my_y][piece.my_x + 1];
    var pieceD = (piece.my_x + 2 < this.width) && this.pieces[piece.my_y][piece.my_x + 2];

    if (pieceA && pieceB && PlayState.isMatch(pieceA, pieceB, piece)) {
        matches.push(pieceA, pieceB);
    }

    if (pieceB && pieceC && PlayState.isMatch(pieceB, piece, pieceC)) {
        matches.push(pieceB, pieceC);
    }

    if (pieceC && pieceD && PlayState.isMatch(piece, pieceC, pieceD)) {
        matches.push(pieceC, pieceD);
    }

    return matches;
}


/**
* This method returns any 3-tile vertical match including this piece
* @method getMatchesVertical
* @public
* @param piece{Sprite}
* @return matches{Array}
*/
PlayState.getMatchesVertical = function (piece) {
    var matches = [];
    matches.push(piece); // adding this now is fine; if we don't find any other pieces, we'll discount a 1-piece match anyway.

    // Find nearby pieces: [A][B][X][C][D] (but vertical)
    var pieceA = (piece.my_y - 2 >= 0) && this.pieces[piece.my_y - 2][piece.my_x];
    var pieceB = (piece.my_y - 1 >= 0) && this.pieces[piece.my_y - 1][piece.my_x];
    var pieceC = (piece.my_y + 1 < this.height) && this.pieces[piece.my_y + 1][piece.my_x];
    var pieceD = (piece.my_y + 2 < this.height) && this.pieces[piece.my_y + 2][piece.my_x];

    if (pieceA && pieceB && PlayState.isMatch(pieceA, pieceB, piece)) {
        matches.push(pieceA, pieceB);
    }

    if (pieceB && pieceC && PlayState.isMatch(pieceB, piece, pieceC)) {
        matches.push(pieceB, pieceC);
    }

    if (pieceC && pieceD && PlayState.isMatch(piece, pieceC, pieceD)) {
        matches.push(pieceC, pieceD);
    }

    return matches;
}

/**
* This method returns all matching tiles that are connected vertically
* @method getMatchesVertical
* @public
* @param piece{Sprite}
* @return matches{Array}
*
PlayState.getMatchesVertical = function (piece) {
    var matches = [];
    matches.push(piece);
    for (var i = piece.my_y - 1; i >= 0; i--) {
        var t = this.pieces[i][piece.my_x];

        if (t.animation.frameIndex == piece.animation.frameIndex) {
            matches.push(t);
        } else {
            break;
        }
    }
    for (var i = piece.my_y + 1; i < this.height; i++) {
        var t = this.pieces[i][piece.my_x];
        if (t.animation.frameIndex == piece.animation.frameIndex) {
            matches.push(t);
        } else {
            break;
        }
    }
    return matches;
}
*/


/**
* This method checks to see if any tile needs animating. If it does it sets the animation variable to true and animates all tiles that need to move.
* @method moveTiles
* @public
*/
PlayState.moveTiles = function(){
    this.animating = false;

    for (var i = 0; i < this.width; i ++){
        for(var j = 0; j < this.height; j++){
            if(this.pieces[j][i].animating){
                this.animating = true;
                break;
            }
        }
    } 
    if(this.animating){
        for (var i = 0; i < this.width; i ++){
            for(var j = 0; j < this.height; j++){
                if(this.pieces[j][i].animating == true){
                    this.pieces[j][i].y += this.step;
                    if (this.pieces[j][i].y >= (this.pieces[j][i].my_y * this.tileSize) + this.startY) {
                        this.pieces[j][i].y = (this.pieces[j][i].my_y * this.tileSize) + this.startY;
                        this.pieces[j][i].animating = false;
                    }
                }
            }
        } 
    }

}

/**
* This method checks the lengths of matches and determines the amount of points awareded
* matches == 3 // One match
* matches > 3 && matches < 6 // Long match
* matches >= 6 && matches < 9 // Two matches
* matches > 9 // Mega combo or two matches 5 or >
* @method updateScore
* @public
* @param matches{Array}
*/

PlayState.updateScore= function(matches){
    if(matches.length == 3){
       this.score += matches.length * 2;
   } else if (matches.length > 3 && matches.length < 6){
       this.score += matches.length * 4;
   } else if (matches.length >= 6 && matches.length < 9){
       this.score += matches.length * 4;
   } else if (matches.length > 10){
       this.score += matches.length * 8;
   }

}







/**
* Operates same as updateBoard method above but moves tiles to their correct position. This means no animation and instantly sets up board with tiles in correct places. 
* You can call the 'clearMatches()' method in the create method to bypass setup stage.
* This method updates the game board after matches have been cleared, then clears any new matches.
* @method updateBoard
* @public
*/
PlayState.updateOriginalBoard = function () {
    for(var i=0; i<this.width; i++){
        var newCount = 0;
        for(var j=this.height-1; j>=0 ;j--){
            var tile = this.pieces[j][i];
            var lowestVisible = -1;
            if(!tile.visible){
                //find next visible and steal its tile
                for (var k = tile.my_y - 1; k >= 0; k--) {
                    if (lowestVisible == -1) {
                        var aboveTile = this.pieces[k][i]; 
                        if (aboveTile.visible) {
                            lowestVisible = aboveTile;
                            break;
                        }
                    }
                }
                if (lowestVisible == -1) {
                    //for tileAboveCounter make new tiles from m y to 
                    var myCounter = 0;
                    for(var l = 0; l < this.height; l++){
                        if(!this.pieces[l][i].visible){
                            myCounter ++;
                        }
                    }
                    newCount++;
                    //no above tile, so randomize a new one
                    var digit = PlayState.getNewTileDigit();
                    var tempTile = new Kiwi.GameObjects.Sprite(PlayState, PlayState.textures.gems, (tile.my_x * PlayState.tileSize) + this.startX, (tile.my_y * PlayState.tileSize) + this.startY);
                    tempTile.animation.switchTo(digit);
                    tempTile.my_x = tile.my_x;
                    tempTile.my_y = tile.my_y;
                    tempTile.animating = true;
                    tempTile.name = 'gem' + tile.my_y  + '_' + tile.my_x;
                    PlayState.addChild(tempTile);
                    tempTile.visible = true;
                    this.pieces[tile.my_y ][tile.my_x] = tempTile;
                    
                } else {
                    this.pieces[lowestVisible.my_y][lowestVisible.my_x] = tile;
                    var lowestVisibleY = lowestVisible.my_y;
                    var lowestVisibleName = lowestVisible.name;

                    lowestVisible.animating = true;
                    lowestVisible.visible = true;
                    lowestVisible.my_y = tile.my_y;
                    lowestVisible.name = tile.name;
                    lowestVisible.x = (tile.my_x * PlayState.tileSize) + this.startX;
                    lowestVisible.y = (tile.my_y * PlayState.tileSize) + this.startY;
                    this.pieces[tile.my_y][tile.my_x] = lowestVisible;

                    tile.my_y = lowestVisibleY;
                    tile.name = lowestVisibleName;
                }
            }
        }
    }
    this.clearOriginalMatches();
}


/**
* This method turns any matching tiles invisible, then calls the updateOriginalBoard method to remove them
* @method clearMatches
* @public
*/
PlayState.clearOriginalMatches = function () {
    var matches = this.getMatches();
    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        for (var j = 0; j < match.length; j++) {
            match[j].visible = false;
        }
    }
    PlayState.matchesCleared = matches.length;
    if (PlayState.matchesCleared > 0) {
        PlayState.updateOriginalBoard();
    } 
}

