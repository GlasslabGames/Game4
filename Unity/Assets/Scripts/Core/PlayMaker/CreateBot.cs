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
  public class CreateBot : FsmStateAction
  {
    public FsmString SchemeAsString;

    public ArgubotSchemes TargetScheme = ArgubotSchemes.NONE;
    
    public override void Reset()
    {
    }
    
    public override void OnEnter()
    {
      if (SchemeAsString.Value != null && TargetScheme != ArgubotSchemes.NONE)
      {
        Debug.LogError("[CreateBot] Both SchemeAsString and TargetScheme are set. Defaulting to SchemeAsString to unlock.");
      }

      ArgubotSchemes scheme;
      if (SchemeAsString.Value != null)
      {
        scheme = (ArgubotSchemes) Enum.Parse(typeof(ArgubotSchemes), SchemeAsString.Value);
      }
      else
      {
        scheme = TargetScheme;
      }

      BotModel bot = EquipmentManager.MakeBot(scheme);

      EquipmentManager.Instance.AddBotToInventory( bot );

      Finish();
    }
  }
}