using UnityEngine;

public class BotStorageObjective : Objective {
  public bool IsStore = false;

  protected override void OnEnable()
  {
    base.OnEnable();
    SignalManager.BotIntoStorage += OnStorageChange;
  }

  public void OnStorageChange(bool isStoring)
  {
    if (isStoring == IsStore)
    {
      m_isComplete = true;
      onComplete();
      gameObject.SetActive(false);
    }
  }

  protected override void OnDisable()
  {
    base.OnDisable();
    SignalManager.BotIntoStorage -= OnStorageChange;
  }
}
