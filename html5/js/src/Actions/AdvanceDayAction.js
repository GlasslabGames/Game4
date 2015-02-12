/**
 * Created by Jerry Fu on 2/10/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.AdvanceDayAction = function(game)
{
    GlassLab.Action.prototype.constructor.call(this);

    this.game = game;
    if (!GLOBAL.advanceDayTextField)
    {
        GLOBAL.advanceDayTextField = game.make.text(0,0, "");
        GLOBAL.advanceDayTextField.fixedToCamera = true;
        this.game.world.add(GLOBAL.advanceDayTextField);
    }
};

GlassLab.AdvanceDayAction.prototype = Object.create(GlassLab.Action.prototype);
GlassLab.AdvanceDayAction.prototype.constructor = GlassLab.AdvanceDayAction;

GlassLab.AdvanceDayAction.prototype.Do = function()
{
    GLOBAL.advanceDayTextField.setText("Advance Day");
    this.timer = this.game.time.create();
    this.timer.add(1000, function(){
        GLOBAL.advanceDayTextField.setText("");
        this.timer.stop(true);
        this.timer.destroy();
        this.timer = null;
        this._complete();
    }, this);
    this.timer.start();
};