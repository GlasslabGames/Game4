using UnityEngine;

public class InteractWithObjectObjective : Objective {
  public string ObjectName;
  private GameObject m_target;

  protected override void OnEnable()
  {
    base.OnEnable();
    SignalManager.ObjectUsed += OnObjectUsed;
  }

  public void OnObjectUsed(InteractiveObject obj)
  {
    if (obj.name == ObjectName)
    {
      m_isComplete = true;
      onComplete();
      gameObject.SetActive(false);
    }
  }

  protected override void OnDisable()
  {
    base.OnDisable();
    SignalManager.ObjectUsed -= OnObjectUsed;
  }
}
