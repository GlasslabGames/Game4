
public class CoreConstructionCondition : Conditional {

  // Filled by deserialization
  public float MaxPerformancePercentage = 1f;
  public float MinPerformancePercentage = 0f;

  public int MinCoresTested = 0;
  public int MaxPerformanceRecencyWindow = -1;
  // -------------------

  public CoreConstructionCondition()
  {
    SignalManager.CoreConstructionPuzzleAttempted += onPuzzleAttempted;
    SignalManager.CoreConstructionCompleted += onCoreConstructionCompleted;
    SignalManager.CoreEquipClosed += Refresh;
  }

  protected override bool CalculateIsSatisfied()
  {
    /*
    UnityEngine.Debug.Log("[CoreConstructionCondition] MinCoresTested: " + MinCoresTested +
                      " \tMinPerformancePercentage: " + MinPerformancePercentage +
                      " \tMaxPerformancePercentage: " + MaxPerformancePercentage +
                      " \tCoreAttempts: " + CoreConstructionStatManager.Instance.CoreAttempts +
                      " \tActualPerformance: " + CoreConstructionStatManager.Instance.GetCorePerformance(MaxPerformanceRecencyWindow));
                      */
    return
      CoreConstructionStatManager.Instance.CoreAttempts >= MinCoresTested &&
      CoreConstructionStatManager.Instance.GetCorePerformance(MaxPerformanceRecencyWindow) != -1 &&
      CoreConstructionStatManager.Instance.GetCorePerformance(MaxPerformanceRecencyWindow) >= MinPerformancePercentage &&
      CoreConstructionStatManager.Instance.GetCorePerformance(MaxPerformanceRecencyWindow) <= MaxPerformancePercentage;
  }

  private void onPuzzleAttempted(bool success)
  {
    Refresh();
  }

  private void onCoreConstructionCompleted(bool completed)
  {
    Refresh();
  }

  ~CoreConstructionCondition()
  {
    SignalManager.CoreConstructionPuzzleAttempted -= onPuzzleAttempted;
    SignalManager.CoreConstructionCompleted -= onCoreConstructionCompleted;
    SignalManager.CoreEquipClosed -= Refresh;
  }
}