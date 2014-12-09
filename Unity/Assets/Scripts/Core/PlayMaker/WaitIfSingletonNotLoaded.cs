//
// WaitIfConversationActive.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 7 - 3

using UnityEngine;
using System;
using System.Collections.Generic;
using PixelCrushers.DialogueSystem;

namespace HutongGames.PlayMaker.Actions
{
  [ActionCategory("DialogueManager")]
  [Tooltip("Waits for a singleton to be loaded. (need update to work for other singletons)")]
  public class WaitIfSingletonNotLoaded : FsmStateAction
  {
    //public string WaitingSingleton;

    public override void OnEnter()
    {
      if (BotPicker.Instance != null)
        Finish();
    }

    public override void OnUpdate()
    {
      if (BotPicker.Instance != null)
        Finish();
    }
  }
}