using System.Collections.Generic;
using UnityEngine;

public class GetEquipmentObjective : Objective 
{
  public int EquipmentModelID;
  
  private float m_initialCount;
  
  void Start()
  {
    SignalManager.EquipmentObtained += onEquipmentObtained;
  }
  
  override protected void OnDisable()
  {
    SignalManager.EquipmentObtained -= onEquipmentObtained;
  }
  
  private void onEquipmentObtained(EquipableModel model)
  {
    if (EquipmentModelID == model.Id || EquipmentModelID == -1)
    {
      ObjectiveComplete();
    }
  }
}