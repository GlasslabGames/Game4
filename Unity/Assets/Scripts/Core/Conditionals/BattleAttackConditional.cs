

using Battle;

public class BattleAttackConditional : Conditional
{
  // Deserialized value
  public float MinAttackPerformancePercentage = 0f;
  public float MaxAttackPerformancePercentage = float.MaxValue;
  public int MaxAttackRecencyWindow = int.MaxValue;
  public int MaxBattleRecencyWindow = int.MaxValue;
  // ----------------
  
  public BattleAttackConditional()
  {
    SignalManager.DamageTaken += onDamageTaken;
  }
  
  override protected bool CalculateIsSatisfied()
  {
    float attackPerformance = CombatStatsManager.Instance.GetAttackPerformance(MaxAttackRecencyWindow, MaxBattleRecencyWindow);
    // check for battles won
    return 
        attackPerformance >= MinAttackPerformancePercentage &&
        attackPerformance <= MaxAttackPerformancePercentage;
  }
  
  private void onDamageTaken(BotView bv, float damage)
  {
    Refresh();
  }
  
  //private 
  
  ~BattleAttackConditional()
  {
    SignalManager.DamageTaken -= onDamageTaken;
  }
}