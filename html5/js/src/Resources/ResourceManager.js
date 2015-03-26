/**
 * Created by Jerry Fu on 3/26/2015.
 */

var GlassLab = GlassLab || {};

/**
 * ResourceManager
 */
GlassLab.ResourceManager = function (game)
{
    this.game = game;

    this.resourceCache = {};
};

/**
 * Used to force the PIXI renderer to keep a copy of an image around
 * @param resourceKey
 */
GlassLab.ResourceManager.prototype.preloadResource = function(resourceKey)
{
    if (!this.resourceCache.hasOwnProperty(resourceKey))
    {
        var resource = this.game.add.sprite(0,0,resourceKey);
        resource.alpha = 0.001;
        resource.fixedToCamera = true;
        //resource.animations.add('anim'); // this animation uses the whole spritesheet
        //resource.animations.play('anim', 30, true);
        this.resourceCache[resourceKey] = resource;

        console.log("Preloading "+ resourceKey);
    }
};

GlassLab.ResourceManager.prototype.releaseResource = function(resourceKey)
{
    if (this.resourceCache.hasOwnProperty(resourceKey))
    {
        this.resourceCache[resourceKey].destroy(true);
        delete this.resourceCache[resourceKey];
    }
};
