//
// ShowRobodex.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 - 3
using UnityEngine;
using System.Collections.Generic;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  public class LevelUpBot : FsmStateAction
  {

    public override void OnEnter()
    {
      BotModel bot = EquipmentManager.Instance.CurrentlyEditingBot;
      if (bot == null) {
        Debug.LogError("[LevelUpBot] Trying to level up a bot, but which bot was not set in EquipmentManager!");
      } else {
        bot.Level ++;
        if (UnlockBotPopup.Instance != null) UnlockBotPopup.Instance.ShowLevelUp(bot);
        Debug.Log("[LevelUpBot] Level up bot "+bot+" to level "+bot.Level);

        PegasusManager.Instance.GLSDK.AddTelemEventValue( "botName", bot.Name );
        PegasusManager.Instance.GLSDK.AddTelemEventValue( "botLevel", bot.Level );
        PegasusManager.Instance.GLSDK.AddTelemEventValue( "botEvo", bot.Evo );
        PegasusManager.Instance.AppendDefaultTelemetryInfo();
        PegasusManager.Instance.GLSDK.SaveTelemEvent( "LevelUp_bot" );

      }
      Finish ();
    }
  }
}