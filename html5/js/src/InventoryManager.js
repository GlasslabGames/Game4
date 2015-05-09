/**
 * Created by Jerry Fu on 2/2/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.InventoryManager = function(game)
{
    this.game = game;
    this.money = 10;

    GlassLab.SignalManager.gameInitialized.addOnce(this._onInitGame, this);
};

GlassLab.InventoryManager.prototype._onInitGame = function() {
    if (GLOBAL.saveManager.HasData("money")) this.money = GLOBAL.saveManager.LoadData("money");

    this._loadUnlockedFood();
};

GlassLab.InventoryManager.prototype.lockAll = function() {
    for (var key in GlassLab.FoodTypes) GlassLab.FoodTypes[key].unlocked = false;
    this._saveUnlockedFood();
};

GlassLab.InventoryManager.prototype.unlockAll = function() {
    for (var key in GlassLab.FoodTypes) GlassLab.FoodTypes[key].unlocked = true;
    this._saveUnlockedFood();
};

GlassLab.InventoryManager.prototype.unlock = function(type) {
    if (GlassLab.FoodTypes[type]) GlassLab.FoodTypes[type].unlocked = true;
    this._saveUnlockedFood();
};

// set a specific food to be available for buying
GlassLab.InventoryManager.prototype.setAvailable = function(food) {
    GlassLab.FoodTypes[food].available = true;
};

// set only the given foods to be available
GlassLab.InventoryManager.prototype.setAvailableOnly = function(foods) {
    foods = [].concat(foods); // ensure it's an array
    for (var key in GlassLab.FoodTypes) {
        GlassLab.FoodTypes[key].available = (foods.indexOf(key) > -1);
    }
};

// set all foods to be available
GlassLab.InventoryManager.prototype.setAllAvailable = function() {
    for (var key in GlassLab.FoodTypes) GlassLab.FoodTypes[key].available = true;
};

GlassLab.InventoryManager.prototype._saveUnlockedFood = function()
{
    var unlockedItems = [];
    for (var type in GlassLab.FoodTypes)
    {
        if (GlassLab.FoodTypes[type].unlocked)
        {
            unlockedItems.push(type);
        }
    }

    GLOBAL.saveManager.SaveData("unlockedItems", unlockedItems);
};

GlassLab.InventoryManager.prototype._loadUnlockedFood = function()
{
    if (GLOBAL.saveManager.HasData("unlockedItems")) {
        var unlockedItems = GLOBAL.saveManager.LoadData("unlockedItems");
        for (var i = 0; i < unlockedItems.length; i++) {
            var type = unlockedItems[i];
            if (GlassLab.FoodTypes[type]) GlassLab.FoodTypes[type].unlocked = true;
        }
    }
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

GlassLab.InventoryManager.prototype.AddMoney = function(amt)
{
    this.money += amt;

    GlassLab.SignalManager.moneyChanged.dispatch(amt);
    GLOBAL.saveManager.SaveData("money", this.money);
};