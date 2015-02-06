/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryManager = function(game)
{
    this.game = game;
    this.money = 10;
};

GlassLab.InventoryManager.prototype.TrySpendMoney = function(amt)
{
    if (this.money < amt)
    {
        return false;
    }
    else
    {
        this.money -= amt;
        GlassLab.SignalManager.moneyChanged.dispatch(amt);
        return true;
    }
}