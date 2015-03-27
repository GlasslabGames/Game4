/**
 * Created by Rose Abernathy on 3/20/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.DoOrderChallengeAction = function(game)
{
    GlassLab.DoChallengeAction.prototype.constructor.call(this);

    this.challengeType = "order";
};

GlassLab.DoOrderChallengeAction.prototype = Object.create(GlassLab.DoChallengeAction.prototype);
GlassLab.DoOrderChallengeAction.prototype.constructor = GlassLab.DoOrderChallengeAction;

GlassLab.DoOrderChallengeAction.prototype.Do = function()
{
    if (!this.objective) this.objective = "Fulfill an urgent order";

    GlassLab.DoChallengeAction.prototype.Do.call(this);

    this.challengeData.key = true; // mark that this order is key for this challenge
    GLOBAL.mailManager.AddOrders(this.challengeData);

    GlassLab.SignalManager.orderResolved.remove(this._onOrderResolved, this); // make sure we don't have two copies
    GlassLab.SignalManager.orderResolved.add(this._onOrderResolved, this);
};

GlassLab.DoOrderChallengeAction.prototype._onDestroy = function() {
    GlassLab.DoChallengeAction.prototype._onDestroy.call(this);
    GlassLab.SignalManager.orderResolved.remove(this._onOrderResolved, this);
};

GlassLab.DoOrderChallengeAction.prototype._onOrderResolved = function(order, success) {
    if (!order.key) return; // it wasn't the order we were waiting for

    if (success) this.completeChallenge();
    else this.failChallenge();
};