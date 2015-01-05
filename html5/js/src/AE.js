/**
 * Created by Jerry Fu on 12/17/2014.
 */

AE = {};

AE.Composition = function()
{
    this.w;
    this.h;
    this.id;
};
AE.Composition.prototype = {};


AE.Keyframe = function()
{
    this.frame;
};

AE.Layer = function()
{
    this.name;
    this.type;
    this.id;
    this.parent;
    this.index;
    this.w;
    this.h;
    this.inPoint;
    this.outPoint;
    this.blending;
}