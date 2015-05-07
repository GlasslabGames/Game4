/**
 * Created by Jerry Fu on 3/4/2015.
 */

/**
 * CreatureState
 */
GlassLab.CreatureState = function (game, owner) {
    this.creature = owner;
    this.game = game;
};

GlassLab.CreatureState.prototype.Enter = function () {
    this.active = true;
};

GlassLab.CreatureState.prototype.Exit = function () {
    this.active = false;
};

GlassLab.CreatureState.prototype.Update = function () {
};
