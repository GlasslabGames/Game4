/**
 * Created by Jerry Fu on 1/20/2015.
 */


var GlassLab = GlassLab || {};

// Requires phaser
/*
 * CloudManager
 */

GlassLab.CloudManager = function(game)
{
    this.game = game;
    this.renderGroup = game.make.group();
    this.clouds = [];

    for (var i=0; i < 5; i++)
    {
        var cloud = new GlassLab.Cloud(this.game, this.renderGroup);
        cloud.sprite.isoY = (Math.random() * GLOBAL.tileManager.GetMapWidth() - GLOBAL.tileManager.centerTile.y) * GLOBAL.tileManager.tileSize;
    }

    this.spawnCloudTimer = this.game.time.events.add(Math.random()*3000+2000, this.SpawnCloud, this);
};


GlassLab.CloudManager.prototype.SpawnCloud = function()
{
    var cloud = new GlassLab.Cloud(this.game, this.renderGroup);
    this.spawnCloudTimer = this.game.time.events.add(Math.random()*5000+10000, this.SpawnCloud, this); // TODO: Use interval instead
};


/*
 * Cloud
 */

GlassLab.Cloud = function(game, renderGroup)
{
    this.game = game;
    this.renderGroup = renderGroup;

    this.sprite = this.game.make.isoSprite(0,0,0,"cloudShadow");
    this.sprite.isoX = ((Math.random() * GLOBAL.tileManager.GetMapHeight()) - GLOBAL.tileManager.centerTile.x) * GLOBAL.tileManager.tileSize;
    this.sprite.isoY = (GLOBAL.tileManager.centerTile.y - GLOBAL.tileManager.GetMapWidth()) * GLOBAL.tileManager.tileSize;
    var scale = 3 - (Math.random() * Math.random() * 2);
    this.sprite.scale.setTo(scale, scale);
    this.sprite.anchor.setTo(0, 1);
    this.sprite.alpha = Math.random() * 0.5 + 0.5;
    this.renderGroup.add(this.sprite);

    this.updateHandler = GlassLab.SignalManager.update.add(this._onUpdate, this);
};

GlassLab.Cloud.prototype._onUpdate = function(dt)
{
    this.sprite.isoY += .8;

    if (this.sprite.isoY >= GLOBAL.tileManager.GetMapWidth() * GLOBAL.tileManager.tileSize + this.sprite.width)
    {
        this.destroy();
    }
};

GlassLab.Cloud.prototype.destroy = function()
{
    this.renderGroup.remove(this.sprite);
    this.updateHandler.detach();
    this.sprite = null;
    this.game = null;
    this.renderGroup = null;
};