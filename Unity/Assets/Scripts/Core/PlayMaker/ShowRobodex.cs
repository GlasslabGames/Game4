//
// ShowRobodex.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 - 3
using UnityEngine;
using System.Collections.Generic;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  [Tooltip("Show Robodex")]
  public class ShowRobodex : FsmStateAction
  {
    public FsmVar StoreResult;

    public ArgubotSchemes[] SchemesToShow;

    public bool CheckInEquipmentManager = false;

    public override void Reset()
    {
      StoreResult = null;
    }
    
    public override void OnEnter()
    {
      ArgubotSchemes[] UnlockedSchemes = EquipmentManager.Instance.UnlockedSchemes.ToArray();
      if (CheckInEquipmentManager && UnlockedSchemes.Length > 0)
        RobodexController.Instance.Show(onRobodexClosed, UnlockedSchemes);
      else
        RobodexController.Instance.Show(onRobodexClosed, SchemesToShow);
    }

    private void onRobodexClosed(ArgubotSchemes pickedScheme)
    {
      Debug.Log(pickedScheme);
      StoreResult.SetValue(pickedScheme.ToString());

      Finish ();
    }
  }
}