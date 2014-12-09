using UnityEngine;
using System;
using System.Collections.Generic;

public class SignalTarget : MonoBehaviour
{
  private Dictionary<SignalType, Delegate> m_signals;
  public SignalTarget ()
  {
  }

  public void Signal(SignalType type, params object[] args)
  {
    //m_signals [type].;
  }
}