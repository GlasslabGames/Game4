//
// UnlockScheme.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 - 3
//

using UnityEngine;
using System.Collections.Generic;
using System;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  [Tooltip("Show Robodex")]
  public class UnlockScheme : FsmStateAction
  {
    public FsmString SchemeAsString;

    public ArgubotSchemes TargetScheme = ArgubotSchemes.NONE;

    public bool ShowPopup = true;
    
    public override void Reset()
    {
    }
    
    public override void OnEnter()
    {
      if (!string.IsNullOrEmpty(SchemeAsString.Value) && TargetScheme != ArgubotSchemes.NONE)
      {
        Debug.LogError("[UnlockScheme] Both SchemeAsString and TargetScheme are set. Defaulting to SchemeAsString to unlock.");
      }

      ArgubotSchemes scheme;
      if (!string.IsNullOrEmpty(SchemeAsString.Value))
      {
        scheme = (ArgubotSchemes) Enum.Parse(typeof(ArgubotSchemes), SchemeAsString.Value);
      }
      else
      {
        scheme = TargetScheme;
      }
      
      EquipmentManager.Instance.UnlockScheme(scheme, ShowPopup);

      Finish();
    }
  }
}