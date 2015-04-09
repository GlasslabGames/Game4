/**
 * Created by Rose on 4/8/2015.
 */
/**
 * Poo, aka "droppings" :/
 */
GlassLab.Poo = function(game, type) {
    GlassLab.WorldObject.prototype.constructor.call(this, game);
    this.draggableComponent.active = false; // you can't drag poo
};

GlassLab.Poo.prototype = Object.create(GlassLab.WorldObject.prototype);
GlassLab.Poo.prototype.constructor = GlassLab.Poo;