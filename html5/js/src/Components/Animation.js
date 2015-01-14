/**
 * Created by Jerry Fu on 1/9/2015.
 */

var GlassLab = GlassLab || {};

/**
 * Animation
 */

GlassLab.Animation = function(ownerEntity, name) {
    GlassLab.Component.call(this, ownerEntity);

};

GlassLab.Animation.prototype = Object.create(GlassLab.Component.prototype);
GlassLab.Animation.prototype.constructor = GlassLab.Animation;

GlassLab.Animation.prototype.test = function(component) {
};

