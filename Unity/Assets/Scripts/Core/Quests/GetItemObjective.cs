using System.Collections.Generic;
using UnityEngine;

public class GetItemObjective : Objective 
{
  public int InventoryItemModelID;

  private float m_initialCount;

  override protected void OnEnable()
  {
    if (InventoryView.Instance.HasItem(InventoryItemModelID))
    {
      ObjectiveComplete();
      return;
    }
    
    SignalManager.ItemObtained += onItemObtained;
  }

  override protected void OnDisable()
  {
    SignalManager.ItemObtained -= onItemObtained;
  }

  private void onItemObtained(InventoryItemModel model)
  {
    if (InventoryItemModelID == model.Id)
    {
      ObjectiveComplete();
    }
  }
}
