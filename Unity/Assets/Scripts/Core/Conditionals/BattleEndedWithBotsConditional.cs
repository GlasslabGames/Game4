
using System.Collections.Generic;
using Battle;

public class BattleEndedWithBotsConditional : Conditional
{
  // Filled by deserialization
  public int MinNumSurvivingBots = 0;

  public BattleEndedWithBotsConditional()
  {
    SignalManager.CombatEnded += onCombatEnded;
  }

  private void onCombatEnded(bool victory)
  {
    Refresh();
  }

  override protected bool CalculateIsSatisfied()
  {
    if (BattleManager.Instance != null)
    {
    int numBotsAlive = 0;
    List<BotView> bots = BattleManager.Instance.Player.Bots;
    for (int i=bots.Count-1; i>=0; i--)
    {
      if (bots[i].Alive)
      {
        numBotsAlive++;
      }
    }

    return numBotsAlive >= MinNumSurvivingBots;
    }
    else
    {
      return false;
    }
  }

  ~BattleEndedWithBotsConditional()
  {
    SignalManager.CombatEnded -= onCombatEnded;
  }
}