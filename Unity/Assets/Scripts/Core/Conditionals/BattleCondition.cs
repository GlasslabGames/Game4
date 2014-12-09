
public class BattleCondition : Conditional
{
  // Deserialized value
  public int MinTimesPlayed = 0;
  public float MinBattlePerformancePercentage = 0f;
  public float MaxBattlePerformancePercentage = float.MaxValue;
  public int MaxBattleRecencyWindow = int.MaxValue;
  // ----------------

  public BattleCondition()
  {
    SignalManager.CombatEnded += onCombatEnded;
  }

  override protected bool CalculateIsSatisfied()
  {
    float battlePerformance = CombatStatsManager.Instance.GetBattlePerformance(MaxBattleRecencyWindow);
    // check for battles won
    return CombatStatsManager.Instance.BattlesPlayed >= MinTimesPlayed &&
      battlePerformance != -1 &&
        battlePerformance >= MinBattlePerformancePercentage &&
        battlePerformance <= MaxBattlePerformancePercentage;
  }

  private void onCombatEnded(bool victory)
  {
    Refresh();
  }

  //private 

  ~BattleCondition()
  {
    SignalManager.CombatEnded -= onCombatEnded;
  }
}