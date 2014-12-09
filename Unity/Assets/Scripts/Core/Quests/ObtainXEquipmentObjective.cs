using System.Collections.Generic;
using UnityEngine;

public class ObtainXEquipmentObjective : Objective 
{
  [PersistAttribute]
  public int NumberOfItems;
  
  [PersistAttribute]
  private float m_initialCount = -1f;
  
  void Awake()
  {
    Debug.Log ("[ObtainXEquipmentObjective] Awake. initialCount: "+m_initialCount+" numberOfItems: "+NumberOfItems);
    if(m_initialCount == -1f)
    {
      m_initialCount = NumberOfItems;
    }
  }
  
  void Start()
  {
    if (SignalManager.ObjectiveChanged != null) { SignalManager.ObjectiveChanged(this); }
  }

  override protected void OnEnable()
  {
    SignalManager.EquipmentObtained += onEquipmentObtained;
  }
  
  override protected void OnDisable()
  {
    SignalManager.EquipmentObtained -= onEquipmentObtained;
  }

  override public void Reset() {
    base.Reset();
    NumberOfItems = (int) m_initialCount;
    // This doesn't really work. I'm going to write a new Objective called ObtainAllEvidence instead, so if you want to use this debug it yourself.
  }

  private void onEquipmentObtained(EquipableModel eq)
  {
    NumberOfItems--;

    Debug.Log ("[ObtainXEquipmentObjective] onEquipmentObtained. numberOfItems: "+NumberOfItems);
    if (SignalManager.ObjectiveChanged != null) { SignalManager.ObjectiveChanged(this); }

    if (CalculateIsComplete())
    {
      m_isComplete = true;
      onComplete ();
      gameObject.SetActive(false);
    }
  }
  
  public override float GetProgress()
  {
    Debug.Log ("[ObtainXEquipmentObjective] GetProgress. initialCount: "+m_initialCount+" numberOfItems: "+NumberOfItems);
    return 1 - Mathf.Max((NumberOfItems / m_initialCount), 0);
  }
  
  public override void Refresh ()
  {
    Debug.Log ("[ObtainXEquipmentObjective] Refresh. numberOfItems: "+NumberOfItems);
    m_isComplete = NumberOfItems == 0;
  }
}
