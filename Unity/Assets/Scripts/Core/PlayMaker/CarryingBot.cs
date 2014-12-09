using UnityEngine;
using System.Collections.Generic;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  [Tooltip("Check Carrying Bot Number")]
  public class CarryingBot : FsmStateAction
  {
    public int MaxCarrying = 3;

    public FsmInt StoreCarringNum;

    public override void Reset()
    {
      StoreCarringNum = null;
    }
    
    public override void OnEnter()
    {
      StoreCarringNum.Value = EquipmentManager.Instance.CarryingBotNum();
      Finish ();
    }
  }
}