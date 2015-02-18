/**
 * Created by Rose Abernathy on 2/13/2015.
 */

/**
 * SortingGame
 */

GlassLab.SortingGame = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.width = 750;
    this.height = 550;

    this.cards = []; // list the SortingGameCards

    var bg = game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawRect(0, 0, this.width, this.height);
    this.sprite.addChild(bg);

    var label = game.make.text(15, 15, "Match tokens to cards by predicting how much food each set of creatures will have!", {font: "bold 13pt arial"});
    this.sprite.addChild(label);

    this.addCard( new GlassLab.SortingGameCard(game) );
    this.addCard( new GlassLab.SortingGameCard(game) );
    this.addCard( new GlassLab.SortingGameCard(game) );
};

GlassLab.SortingGame.prototype.addCard = function(card) {
    console.log(card);
    this.sprite.addChild(card);
    card.x = 15 + this.cards.length * 245;
    card.y = 50;
    this.cards.push(card);
};

/**
 * SortingGameCard
 */

GlassLab.SortingGameCard = function(game, creatureType, numCreatures, numFoodsPerCreature, displayMode) {
    GlassLab.UIDragTarget.prototype.constructor.call(this, game, 230, 350, "", true);

    var creatureInfo = GLOBAL.creatureManager.GetCreatureData(creatureType);

    if (displayMode == GlassLab.SortingGameCard.DISPLAY_STYLES.spritesOnly) {
        var colWidth = 50, rowHeight = 50;
        for (var col = 0; col < numCreatures; col++) {
            //var creature = this.game.make.sprite(col * colWidth, 0, );
        }
    }

};

// Extend UIDragTarget
GlassLab.SortingGameCard.prototype = Object.create(GlassLab.UIDragTarget.prototype);
GlassLab.SortingGameCard.prototype.constructor = GlassLab.SortingGameCard;

// Enum all the possible display styles for the cards. Add more as needed.
GlassLab.SortingGameCard.DISPLAY_STYLES = {spritesOnly: "spritesOnly", numbersOnly: "numbersOnly"};