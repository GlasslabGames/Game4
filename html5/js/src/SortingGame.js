/**
 * Created by Rose Abernathy on 2/13/2015.
 */

/**
 * SortingGame
 */

GlassLab.SortingGame = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    var bg = game.make.graphics();
    bg.beginFill(0xFFFFFF).lineStyle(3, 0x000000, 1).drawRect(0, 0, 800, 600);
    this.sprite.addChild(bg);
};

