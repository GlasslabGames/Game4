/**
 * Created by Rose Abernathy on 4/8/2015.
 */
/**
 * CreatureStatePooping - when it has eaten too much
 */
GlassLab.CreatureStatePooping = function(game, owner)
{
    GlassLab.CreatureState.call(this, game, owner);
};

GlassLab.CreatureStatePooping.prototype = Object.create(GlassLab.CreatureState.prototype);
GlassLab.CreatureStatePooping.constructor = GlassLab.CreatureStatePooping;

GlassLab.CreatureStatePooping.prototype.Enter = function() {
    GlassLab.CreatureState.prototype.Enter.call(this);
    this.pooped = false;

    this.creature.draggableComponent.setActive(false);
    this.poopFrame = GLOBAL.creatureManager.creatureDatabase[this.creature.type].fxFrames.poop;
    this.creature.wantToPoop = false;

    this.anim = this.creature.PlayAnim("poop", false, this.creature.baseAnimSpeed, true);
    if (this.anim) this.anim.onComplete.addOnce(this._onFinishPooping, this);
    else this._onFinishPooping();
};

GlassLab.CreatureStatePooping.prototype.Update = function() {
  if (!this.pooped && this.anim && this.anim.frame >= this.poopFrame) this._onPoop(); // this is the frame index where we should add the poop
};

GlassLab.CreatureStatePooping.prototype._onPoop = function() {
    this.pooped = true;
    this.creature.resetFoodEaten(true);

    var poop = new GlassLab.Poop(this.game);
    GLOBAL.foodLayer.addChild(poop);
    poop.scale.setTo(this.creature.sprite.scale.x * 2, this.creature.sprite.scale.y * 2);
    var globalPos = this.creature.getGlobalPos();
    poop.isoX = globalPos.x;
    poop.isoY = globalPos.y;
    if (this.creature.sprite.scale.x > 0) {
        poop.isoX += 40;
        poop.isoY -= 20;
    } else {
        poop.isoX -= 20;
        poop.isoY += 30;
    }
};

GlassLab.CreatureStatePooping.prototype.Exit = function() {
  GlassLab.CreatureState.prototype.Exit.call(this);
};

GlassLab.CreatureStatePooping.prototype._onFinishPooping = function() {
    if (!this.pooped) this._onPoop();
    this.creature.lookForTargets();
};