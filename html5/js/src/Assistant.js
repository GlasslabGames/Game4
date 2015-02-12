/**
 * Created by Rose Abernathy on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Assistant = function(game) {
    this.game = game;
    this.sprite = game.make.sprite();

    this.portrait = game.make.sprite(0,0, "assistant");
    this.portrait.anchor.set(0.5, 0.5);
    this.sprite.addChild(this.portrait);

    this.speechBubble = game.make.sprite(-80,0, "speech_bubble");
    this.speechBubble.anchor.set(1, 0.5);
    this.sprite.addChild(this.speechBubble);

    this.label = game.make.text(-140, 0, "Lorem ipsum dolor sit amet\nLorem ipsum dolor sit amet");
    this.label.anchor.set(1, 0.5);
    this.sprite.addChild(this.label);
};