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

    // Add more animals to match the target number
    Animal a = m_animals[0]; // if we don't have at least one animal, we're in trouble anyway ¯\_(ツ)_/¯
    Animal b; Transform t;
    while (m_animals.Count < 10) {
      t = Utility.InstantiateAsChild(a.gameObject, a.transform.parent);
      b = t.GetComponent<Animal>();
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

  void Update()
  {
    RefreshHappiness();
  }
}

