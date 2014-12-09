using UnityEngine;
using System.Collections;
using System.Collections.Generic;

public class ObtainAllEvidenceObjective : Objective {

  private float m_progress = -1;
  [PersistAttribute]
  private int m_total = 0;
  public int TopicId;

	void Awake () {
    m_total = DataModel.GetModelsByTopic(TopicId).Count;
	}
	/*
  override protected void OnEnable()
  {
    Debug.Log ("[ObtainAllEvidenceObjective] Enable");

    base.OnEnable();

    Refresh();
  }

*/
  void Start() {
    Refresh();
  }

  override protected void OnEnable()
  {
    base.OnEnable();
    SignalManager.EquipmentObtained += onEquipmentObtained;
  }
  
  override protected void OnDisable()
  {
    base.OnDisable();
    SignalManager.EquipmentObtained -= onEquipmentObtained;
  }

  private void onEquipmentObtained(EquipableModel eq)
  {
    Refresh();
    if (SignalManager.ObjectiveChanged != null) { SignalManager.ObjectiveChanged(this); }
  }

  
  public override float GetProgress()
  {
    Refresh();
    return m_progress;
  }

  public override string GetDescription()
  {
    return "Find evidence [ffea80]("+countProgressTotal()+"/"+m_total+")[-]";
  }

  private int countProgressTotal()
  {
    if (EquipmentManager.Instance == null)
      return 0;
    int count = 0;
    List<DataModel> allData = DataModel.GetModelsByTopic(TopicId);
    for (int i=allData.Count-1; i>=0; i--)
    {
      if (EquipmentManager.Instance.IsEquipmentDiscovered(allData[i]) || EquipmentManager.Instance.HasEquipment(allData[i])) // Second check is to ensure old save data equipment will not be ignored
      {
        count++;
      }
    }

    return count;
  }
  
  public override void Refresh ()
  {
    // Count all the data we've collected that belongs to this topic
    int count = countProgressTotal();
    float progress = 0;

    Debug.Log ("[ObtainAllEvidenceObjective] Refresh with number: "+count+" and total: "+m_total);
    progress = count / (float) m_total;
    m_isComplete = progress >= 1;

    if (progress != m_progress)
    {
      m_progress = progress;
      if (SignalManager.ObjectiveChanged != null) { SignalManager.ObjectiveChanged(this); }
    }

    if (m_isComplete)
    {
      onComplete ();
      gameObject.SetActive(false);
    }
  }
}
