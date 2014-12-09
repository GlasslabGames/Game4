
public class WinBattleObjective : Objective {
  
  void OnEnable()
  {
    SignalManager.CombatEnded += onCombatEnded;
    base.OnEnable();
  }

  private void onCombatEnded(bool victory)
  {
    if (victory)
    {
      m_isComplete = true;
      onComplete();
      gameObject.SetActive(false);
    }
  }

  void OnDisable()
   {
    SignalManager.CombatEnded -= onCombatEnded;
    base.OnDisable();
  }
}
