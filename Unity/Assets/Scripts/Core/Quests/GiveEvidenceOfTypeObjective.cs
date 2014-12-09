
public class GiveEvidenceOfTypeObjective : Objective
{
  public ArgubotSchemes TargetScheme;

  protected override void OnEnable()
  {
    base.OnEnable();
    SignalManager.ObjectUsed += OnObjectUsed;
  }
  
  public void OnObjectUsed(InteractiveObject obj)
  {
    EquipableModel em = obj.GetComponent<CoreComponentView>().Model;
    if (em != null && (ArgubotSchemes) DataModel.GetData(em.Id).Scheme == TargetScheme)
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