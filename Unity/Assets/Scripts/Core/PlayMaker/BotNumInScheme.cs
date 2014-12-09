using UnityEngine;
using System.Collections.Generic;
using HutongGames.PlayMaker;
using System;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  [Tooltip("Check bots number in one scheme")]
  public class BotNumInScheme : FsmStateAction
  {
    public FsmString InputScheme;
    public FsmInt StoreSchemeBotNum;

    public override void Reset()
    {
      StoreSchemeBotNum = null;
    }
    
    public override void OnEnter()
    {
      ArgubotSchemes scheme = (ArgubotSchemes) Enum.Parse(typeof(ArgubotSchemes), InputScheme.Value);
      StoreSchemeBotNum.Value = EquipmentManager.Instance.SchemeBotObtained(scheme);
      Finish ();
    }
  }
}