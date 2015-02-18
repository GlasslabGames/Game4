/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryManager = function(game)
{
    this.game = game;
    this.money = GLOBAL.saveManager.LoadData("money") || 10;
};

GlassLab.InventoryManager.prototype._onSaveRequested = function(blob)
{
    blob.money = this.money;
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
        GlassLab.SignalManager.moneyChanged.dispatch(-amt);
        GLOBAL.saveManager.SaveData("money", this.money);
        return true;
    }
};

GlassLab.InventoryManager.prototype.MoneyRewarded = function(amt)
{
    this.money += amt;

    GlassLab.SignalManager.moneyChanged.dispatch(amt);
    GLOBAL.saveManager.SaveData("money", this.money);
};