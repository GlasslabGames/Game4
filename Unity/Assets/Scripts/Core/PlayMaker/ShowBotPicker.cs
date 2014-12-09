//
// ShowRobodex.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 - 3
using UnityEngine;
using System.Collections.Generic;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("QuestManager")]
  public class ShowBotPicker : FsmStateAction
  {
    public FsmVar StoreScheme;
    public FsmVar StoreLevel;
    public FsmVar StoreEvo;

    public override void Reset()
    {
    }
    
    public override void OnEnter()
    {
      BotPicker.Instance.Show(onRobodexClosed);
    }

    private void onRobodexClosed(ArgubotSchemes pickedScheme, int level, int evo)
    {
      StoreScheme.SetValue(pickedScheme.ToString());
      StoreLevel.SetValue(level);
      StoreEvo.SetValue(evo);

      Finish ();
    }
  }
}