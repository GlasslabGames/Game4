using UnityEngine;

public class CoreEquipObjective : Objective {

  protected override void OnEnable()
  {
    base.OnEnable();
    SignalManager.CoreEquipFuse += OnFuse;
  }

  public void OnFuse(bool isFuse)
  {
    if (isFuse)
    {
      m_isComplete = true;
      onComplete();
      gameObject.SetActive(false);
    }
  }

  protected override void OnDisable()
  {
    base.OnDisable();
    SignalManager.CoreEquipFuse -= OnFuse;
  }
}
