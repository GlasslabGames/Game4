using UnityEngine;
using System.Collections.Generic;

public class AnimalPen : MonoBehaviour {
  private GLDragDropContainer m_container;
  private List<Animal> m_animals = new List<Animal>();
  private UILabel m_label;

  public int TargetRatioTerm1;
  public int TargetRatioTerm2;
  private float m_targetQuotient;

  public bool Locked;
  public bool Satisfied;
  public bool WinWhenSatisfied;
  public int[] InitialAnimalCounts;

  private int m_animalCount;

  public Crate ParentCrate;
  public bool AcceptOnlyOneKind;
  public Animal.Kinds TargetKind;
  public int MaxCount;

  public List<Animal> Animals {
    get { return m_animals; }
    set { m_animals = value; }
  }

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
    b.size = new Vector3( b.size.x - 0.2f, b.size.y - 0.2f, b.size.z );
    for (int i = 0; i < InitialAnimalCounts.Length; i++) {
      for (int j = 0; j < InitialAnimalCounts[i]; j++) {
        a = AnimalManager.Instance.CreateAnimal(i, b);
        AddAnimal(a);
      }
    }
  }

  public void onItemDropped(GLDragEventArgs args)
  {
    Animal a = args.DragObject.GetComponent<Animal>();
    if (a != null) {
      if (Locked || (MaxCount > 0 && (m_animalCount >= MaxCount)) || (AcceptOnlyOneKind && TargetKind != a.Kind)) {
        a.TriedToDropInLockedPen = true;
      } else {
        AddAnimal( a );
        args.Consume();
      }
    }
  }

  public void AddAnimal(Animal a) {
    if (!m_animals.Contains(a)) m_animals.Add(a);
    a.InPen = this;
    a.GetComponent<GLDragDropItem>().enabled = !Locked;
    RefreshCount();
  }
	
  public void RemoveAnimal(Animal a) {
    m_animals.Remove(a);
    if (a.InPen == this) a.InPen = null;
    RefreshCount();
  }

  public void RefreshCount(bool finalCount = false) {
    int count0 = 0;
    int count1 = 0;

    foreach (Animal a in m_animals) {
      if (a.Kind == (Animal.Kinds) 0) count0++;
      else if (a.Kind == (Animal.Kinds) 1) count1++;
    }

    if (m_label != null) {
      m_label.text = count0 + " : " + count1;
    }

    if (ParentCrate != null) {
      ParentCrate.UpdateCreatureCount(TargetKind, count0 + count1);
    }

    float quotient = (float) count0 / count1;
    Satisfied = ( quotient == m_targetQuotient );

    // check for win
    if (Satisfied && WinWhenSatisfied) AnimalManager.Instance.DisplayResult();
    else if (finalCount) AnimalManager.Instance.DisplayResult( Satisfied ); // force a result whether we won or lost

    // remember total count for use later
    m_animalCount = count0 + count1;
  }

  // Force each creature to be in or out depending on its position - good for cleaning up after we resize a pen/crate
  public void UpdateCreatures() {
    // This is so inefficient... but it's just a protoype anyway ¯\_(ツ)_/¯
    int count = 0;
    foreach (Animal a in Utility.FindInstancesInScene<Animal>()) {
      if (!a.gameObject.activeInHierarchy) continue; // if the animal is disabled, who cares
      if (collider.bounds.Contains(a.transform.position)) { // check if the animal is currently in the pen or not
        //Debug.Log (a+" is in "+this);
        if (count >= MaxCount || (AcceptOnlyOneKind && TargetKind != a.Kind)) {
          RemoveAnimal(a);
          // We need to move the animal out of the pen, so just pop it out the bottom
          Vector3 pos = a.transform.position;
          pos.y = collider.bounds.min.y - 0.1f;
          a.transform.position = pos;
        } else { // welcome to the pen!
          AddAnimal(a);
          count++;
        }
      } else { // it's not in the pen, so ensure that we aren't counting it as in the pen
        RemoveAnimal(a);
      }
    }
  }

}
