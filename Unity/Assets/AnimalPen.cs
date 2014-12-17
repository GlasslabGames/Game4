using UnityEngine;
using System.Collections.Generic;

public class AnimalPen : MonoBehaviour {
  private GLDragDropContainer m_container;
  private List<Animal> m_animals = new List<Animal>();
  private UILabel m_label;

  public int TargetRatioTerm1;
  public int TargetRatioTerm2;
  private float m_targetQuotient;

  public bool Satisfied;
  public bool WinWhenSatisfied;
  public int[] InitialAnimalCounts;

	void Awake () {
    m_container = GetComponent<GLDragDropContainer>();
    m_container.ItemDropped += onItemDropped;

    m_label = GetComponentInChildren<UILabel>();
    m_targetQuotient = (float) TargetRatioTerm1 / TargetRatioTerm2;
    Debug.Log (this+" targetQuotient: "+m_targetQuotient);
	}

  void Start() {
    Animal a;
    Bounds b = collider.bounds;
    for (int i = 0; i < InitialAnimalCounts.Length; i++) {
      for (int j = 0; j < InitialAnimalCounts[i]; j++) {
        a = AnimalManager.Instance.CreateAnimal(i, b);
        AddAnimal(a);
      }
    }
  }

  private void onItemDropped(GLDragEventArgs args)
  {
    if (args.DragObject.GetComponent<Animal>() != null) {
      AddAnimal( args.DragObject.GetComponent<Animal>() );
      args.Consume();
    }
  }

  public void AddAnimal(Animal a) {
    m_animals.Add(a);
    a.InPen = this;
    RefreshCount();
  }
	
  public void RemoveAnimal(Animal a) {
    m_animals.Remove(a);
    a.InPen = null;
    RefreshCount();
  }

  public void RefreshCount() {
    int count1 = 0;
    int count2 = 0;

    foreach (Animal a in m_animals) {
      if (a.Kind == (Animal.Kinds) 0) count1++;
      else if (a.Kind == (Animal.Kinds) 1) count2++;
    }
    
    m_label.text = count1 + " : " + count2;

    float quotient = (float) count1 / count2;
    Satisfied = ( quotient == m_targetQuotient );

    if (Satisfied && WinWhenSatisfied) AnimalManager.Instance.Win();

  }

}
