//
// AnimalManager.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 10
using System.Collections.Generic;
using UnityEngine;
public class AnimalManager : SingletonBehavior<AnimalManager>
{
  public Transform AnimalParent;
  public int[] AnimalCounts;
  public Color[] AnimalColors;
  public Transform FillBarTransform;
  private float m_totalHappiness;

  private List<Animal> m_animals;
  private List<AnimalPen> m_pens;

  public FloatText FloatTextEffect;
  public FloatText FinalFloatTextEffect;
  public UILabel CreatureCountLabel;

  override protected void Awake()
  {
    base.Awake();

    m_pens = Utility.FindInstancesInScene<AnimalPen>();
    m_animals = new List<Animal>();

    // Add more animals to match the target number
    Bounds b = new Bounds(Vector3.zero, new Vector3(2, 1));
    for (int i = 0; i < AnimalCounts.Length; i++) {
      for (int j = 0; j < AnimalCounts[i]; j++) {
        Debug.Log ("Creating animal "+i+", "+j);
        CreateAnimal(i, b, true);
      }
    }
  }

  public Animal CreateAnimal(int kind, Bounds bounds, bool avoidPens = false)
  {
    Transform t = Utility.InstantiateAsChild(Resources.Load("Animal"), AnimalParent);
    Animal b = t.GetComponent<Animal>();
    b.Kind = (Animal.Kinds) kind;
    b.SetColor(AnimalColors[kind]);
    m_animals.Add(b);
    b.gameObject.name = "Animal"+m_animals.Count;
    Vector3 pos = Vector3.zero;
    for (int i = 0; i < 99; i++) { // try for a while to find a free spot but give up after 99 tries
      pos = new Vector3( Random.Range(bounds.min.x, bounds.max.x), Random.Range(bounds.min.y, bounds.max.y));
      if (!avoidPens || !IsPointInPen(pos)) break;
    }
    t.position = pos;
    return b;
  }

  private bool IsPointInPen(Vector3 point) {
    foreach (AnimalPen pen in m_pens) {
      if (pen.collider.bounds.Contains(point)) {
        return true;
      }
    }
    return false;
  }
  
  private void RefreshHappiness()
  {
    m_totalHappiness = 0;
    int totalAnimals = m_animals.Count;
    for (int i=0; i < totalAnimals; i++)
    {
      if (m_animals[i].Happy) m_totalHappiness++;
    }

    m_totalHappiness /= totalAnimals;
    FillBarTransform.localScale = new Vector3(m_totalHappiness, 1, 1);
  }

  // Splits a single animal a into #num animals
  public void Split(Animal a, int num) {
    // Later we could change this to make one big animal split into multiple small animals or something
    for (int i = 1; i < num; i++) {
      Transform t = Utility.InstantiateAsChild(a.gameObject, a.transform.parent);
      Animal b = t.GetComponent<Animal>();
      b.SetColor(a.BodyTexture.color, true);
      m_animals.Add(b);
      b.gameObject.name = "Animal"+m_animals.Count;
      b.collider.enabled = false;
      Utility.Delay(delegate{ b.collider.enabled = true; }, 1f);
    }

    FloatTextEffect.Show("1 : "+num, a.transform.position);

    if (m_animals.Count >= 9) {
      Utility.Delay ( Win, 1.25f );
    }
  }

  public void Win()
  {
    FinalFloatTextEffect.Show("Good Job!", FinalFloatTextEffect.transform.position);
  }
  
  void Update()
  {
    //RefreshHappiness();
    if (CreatureCountLabel != null) CreatureCountLabel.text = "Creatures: "+m_animals.Count;
  }
}

