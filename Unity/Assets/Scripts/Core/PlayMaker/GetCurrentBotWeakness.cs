//
// ShowRobodex.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 -
using UnityEngine;
using System.Collections.Generic;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  public class GetCurrentBotWeakness : FsmStateAction
  {
    public FsmVar StoreResult;

    public override void Reset()
    {
      StoreResult = null;
    }
    
    public override void OnEnter()
    {
      foreach (BotModel bot in EquipmentManager.InstanceOrCreate.Bots) {
        if (bot != null && bot.Core != null && bot.Core.Weakness != CoreWeaknesses.NONE) {
          StoreResult.SetValue( bot.Core.Weakness.ToString() );
          break;
        }
      }
      Debug.Log ("[GetCurrentBotWeakness] Current weakness is: "+StoreResult.stringValue);
      
      Finish ();
    }
  }
}