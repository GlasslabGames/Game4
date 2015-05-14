/**
 * Created by Rose Abernathy on 2/3/2015.
 */

/**
 * CreatureStateDragged
 */
GlassLab.CreatureStateDragged = function(game, owner)
{
	this.game = game;
	GlassLab.CreatureState.call(this, game, owner);
	//console.log(this.creature,"dragged");
};

GlassLab.CreatureStateDragged.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStateDragged.constructor = GlassLab.CreatureStateDragged;

GlassLab.CreatureStateDragged.prototype.Enter = function()
{
	GlassLab.CreatureState.prototype.Enter.call(this);

	GLOBAL.audioManager.playSoundWithVolumeAndOffset("creaturePickUpWhaSound", 0.6, 0.0, false);

	this.creature.PlayAnim('walk', true, this.creature.baseAnimSpeed * 5);
};

GlassLab.CreatureStateDragged.prototype.Exit = function()
{
	GlassLab.CreatureState.prototype.Exit.call(this);

	// play bounce sound after 125ms:
	this.game.time.events.add(125, function() {
		GLOBAL.audioManager.playSound("creatureBounceSound");
	}, this);

	this.creature.StopAnim();

};