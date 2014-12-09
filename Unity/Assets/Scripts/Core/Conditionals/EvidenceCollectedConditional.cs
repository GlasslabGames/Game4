

public class EvidenceCollectedConditional : Conditional
{
  // Deserialized value
  public float MinPercentage = 0f;

  public EvidenceCollectedConditional()
  {
    SignalManager.EquipmentObtained += onEquipmentObtained;
  }

  private void onEquipmentObtained(EquipableModel item)
  {
    Refresh();
  }

  override protected bool CalculateIsSatisfied()
  {
    Quest currentQuest = QuestManager.Instance.GetCurrentActiveQuest();
    if (currentQuest != null)
    {
      ObtainAllEvidenceObjective[] objectives = currentQuest.GetComponentsInChildren<ObtainAllEvidenceObjective>(true);
      if (objectives != null && objectives.Length > 0)
      {
        UnityEngine.Debug.Log("[EvidenceCollectedConditional] progress: " + objectives[0].GetProgress() + ", MinPercentage: " + MinPercentage);
        return objectives[0].GetProgress() >= MinPercentage;
      }
      else
      {
        UnityEngine.Debug.Log("[EvidenceCollectedConditional] No evidence gathering objective, MinPercentage: " + MinPercentage);
        return false;
      }
    }
    else
    {
      UnityEngine.Debug.Log("[EvidenceCollectedConditional] progress: No active quest");
      return false;
    }
  }

  ~EvidenceCollectedConditional()
  {
    SignalManager.EquipmentObtained -= onEquipmentObtained;
  }
}