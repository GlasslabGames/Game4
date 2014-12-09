using UnityEngine;

public class ContinuousCombatConditional : Conditional
{
  private bool m_lastInteractionWasCombat = false;

  public ContinuousCombatConditional()
  {
    SignalManager.CombatStarted += onCombatStarted;
    SignalManager.CombatEnded += onCombatEnded;
    SignalManager.ExplorationObjectTapped += onObjectTapped;
    SignalManager.RoomChanged += onRoomChanged;
  }
  
  private void onCombatStarted(string oppName)
  {
    if (m_lastInteractionWasCombat)
    {
      IsSatisfied = true;
    }
    else
    {
      m_lastInteractionWasCombat = true;
    }
  }

  private void onCombatEnded(bool victory)
  {
    if (victory)
    {
      m_lastInteractionWasCombat = false;
    }
  }

  private void onRoomChanged(string roomName)
  {
    m_lastInteractionWasCombat = false;
  }
  private void onObjectTapped(GameObject obj)
  {
    FindEquipment[] fes = obj.GetComponentsInChildren<FindEquipment>();
    for (int i=fes.Length-1; i>=0; i--)
    {
      FindEquipment fe = fes[i];
      if (fe.IsPossible() && fe.Properties.ActiveCondition.Satisfied())
      {
        m_lastInteractionWasCombat = false;
      }
    }
  }

  ~ContinuousCombatConditional()
  {
    SignalManager.CombatStarted -= onCombatStarted;
    SignalManager.CombatEnded -= onCombatEnded;
    SignalManager.ExplorationObjectTapped -= onObjectTapped;
    SignalManager.RoomChanged -= onRoomChanged;
  }
}