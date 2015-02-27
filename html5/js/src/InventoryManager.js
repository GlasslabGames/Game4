/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryManager = function(game)
{
    this.game = game;
    this.money = 10;

    this.unlockedItems = {};

    GlassLab.SignalManager.saveRequested.add(this._onSaveRequested, this);
};

GlassLab.InventoryManager.prototype.unlock = function(type) {
    if (GlassLab.FoodTypes[type]) GlassLab.FoodTypes[type].unlocked = true;
    console.log("unlocked",type,GlassLab.FoodTypes[type]);

};

GlassLab.InventoryManager.prototype._onSaveRequested = function(blob)
{
    blob.money = this.money;

    for (var type in GlassLab.FoodTypes)
    {
        if (GlassLab.FoodTypes[type].unlocked)
        {
            this.unlockedItems[type] = true;
        }
    }

    blob.unlockedItems = this.unlockedItems;
};

GlassLab.InventoryManager.prototype._onGameLoaded = function(blob)
{
    this.money = blob.money;

    for (var type in blob.unlockedItems)
    {
        GlassLab.FoodTypes[type].unlocked = blob.unlockedItems[type];
    }

    this.unlockedItems = blob.unlockedItems;
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
        return true;
    }
};

GlassLab.InventoryManager.prototype.AddMoney = function(amt)
{
    this.money += amt;

    GlassLab.SignalManager.moneyChanged.dispatch(amt);
};