//
// AnimalManager.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 10
using System.Collections.Generic;
using UnityEngine;
public class AnimalManager : SingletonBehavior<AnimalManager>
{
  public Transform FillBarTransform;
  private float m_totalHappiness;

  private List<Animal> m_animals;

  override protected void Awake()
  {
    base.Awake();

    m_animals = Utility.FindInstancesInScene<Animal>();

    Color[] animalColors = new Color[3]; 
    animalColors[0] = new Color(0.8f, 0, 0);
    animalColors[1] = new Color(0, 0.6f, 0f);
    animalColors[2] = new Color(0, 0, 0.8f);

    // Add more animals to match the target number
    Animal a = m_animals[0]; // if we don't have at least one animal, we're in trouble anyway ¯\_(ツ)_/¯
    a.SetColor(animalColors[0]);
    Animal b; Transform t;
    while (m_animals.Count < 3) {
      t = Utility.InstantiateAsChild(a.gameObject, a.transform.parent);
      b = t.GetComponent<Animal>();
      b.SetColor(animalColors[m_animals.Count]);
      m_animals.Add(b);
      b.gameObject.name = "Animal"+m_animals.Count;
      t.localPosition = new Vector3( Random.Range(-500, 500), Random.Range(-400, 400));
    }
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
  }

  void Update()
  {
    RefreshHappiness();
  }
}

