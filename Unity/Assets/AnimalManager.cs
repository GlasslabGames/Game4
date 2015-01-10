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
  private List<Food> m_foods;
  public List<Food> Foods {
    get { return m_foods; }
    set { m_foods = value; }
  }
  private List<AnimalPen> m_openPens;

  public FloatText FloatTextEffect;
  public FloatText FinalFloatTextEffect;
  public UILabel CreatureCountLabel;
 
  override protected void Awake()
  {
    base.Awake();

    m_pens = Utility.FindInstancesInScene<AnimalPen>();
    m_animals = new List<Animal>();
    m_foods = new List<Food>();
    m_openPens = new List<AnimalPen>();

    // Either we've added a collider to show where the creatuers should be placed, or just use the whole screen excluding pens
    Bounds b;
    if (collider) b = collider.bounds;
    else b = new Bounds(Vector3.zero, new Vector3(2, 1));

    // Add more animals to match the target number
    for (int i = 0; i < AnimalCounts.Length; i++) {
      for (int j = 0; j < AnimalCounts[i]; j++) {
        //Debug.Log ("Creating animal "+i+", "+j);
        CreateAnimal(i, b, (collider == null)); // if we haven't specified a collider, automatically avoid pens instead
      }
    }

    collider.enabled = false; // it was interfering
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
      b.SetColor(a.BodyTexture.color);
      m_animals.Add(b);
      b.gameObject.name = "Animal"+m_animals.Count;
      b.collider.enabled = false;
      Utility.Delay(delegate{ b.collider.enabled = true; }, 1f);
    }

    FloatTextEffect.Show("1 : "+num, a.transform.position);

    if (m_animals.Count >= 9) {
      //Utility.Delay ( DisplayResult, 1.25f );
    }
  }

  public void DropFood(Food food) {
    food.transform.parent = transform;
    m_foods.Add(food);

    // for each animal, consider moving it towards this food
    foreach (Animal a in m_animals) {
      if (a.Kind != food.Kind) continue;
      if (a.CurrentState is IdleState) { // it's just sitting around, of course it wants food
        a.BeginMovingTowardsFood(food);
      } else if (a.CurrentState is TowardsFoodState) { // it's heading for some other food, but switch if the new one is closer
        Food oldFood = ((TowardsFoodState) a.CurrentState).TargetFood;
        if (Vector3.Distance (a.transform.position, food.transform.position) <=
            Vector3.Distance(a.transform.position, oldFood.transform.position)) {
          a.BeginMovingTowardsFood(food);
        }
      }
    }
  }

  public void FoodEaten(Food food) {
    m_foods.Remove(food);
    // foreach animal that was targetting this food, either move it towards the next closest or switch it back to idle
    foreach (Animal a in m_animals) {
      if ((a.CurrentState is EatingFoodState && ((EatingFoodState) a.CurrentState).TargetFood == food) ||
          (a.CurrentState is TowardsFoodState && ((TowardsFoodState) a.CurrentState).TargetFood == food)) {
        Food closestFood = null;
        if (m_foods.Count > 0) {
          float closestDist = float.PositiveInfinity;
          foreach (Food f in m_foods) {
            if (a.Kind != f.Kind) continue;
            float dist = Vector3.Distance(a.transform.position, f.transform.position);
            if (dist < closestDist) {
              closestDist = dist;
              closestFood = f;
            }
          }
        }
        if (closestFood != null) a.BeginMovingTowardsFood(closestFood);
        else a.BeginIdle();
      }
    }
  }

  public void AttractAnimalsToPen(AnimalPen pen) {
    if (m_openPens.Contains(pen)) return; // no need
    m_openPens.Add(pen);
    Debug.Log ("Start attracting animals to "+pen);

    // for each animal, consider moving it towards this pen
    foreach (Animal a in m_animals) {
      if (a.Kind != pen.TargetKind) continue;
      if (a.CurrentState is TowardsPenState) { // it's heading for some other pen, but switch if the new one is closer
        AnimalPen oldPen = ((TowardsPenState) a.CurrentState).TargetPen;
        if (Vector3.Distance (a.transform.position, pen.transform.position) <=
            Vector3.Distance(a.transform.position, oldPen.transform.position)) {
          a.BeginMovingTowardsPen(pen);
        }
      } else if (a.CurrentState is IdleState) {
		    a.BeginMovingTowardsPen(pen);
		  }
    }
    
  }

  public void StopAttractingAnimals(AnimalPen pen) {
    if (!m_openPens.Contains(pen)) return; // no need
    m_openPens.Remove(pen);
    Debug.Log ("Stop attracting animals to "+pen);
    // foreach animal that was targetting this food, either move it towards the next closest or switch it back to idle
    foreach (Animal a in m_animals) {
      if (a.CurrentState is TowardsPenState && ((TowardsPenState) a.CurrentState).TargetPen == pen) {
        Debug.Log ("Stop "+a+" going to "+pen+". Num open pens? "+m_openPens.Count);

        AnimalPen closestPen = null;
        if (m_openPens.Count > 0) {
          float closestDist = float.PositiveInfinity;
          foreach (AnimalPen p in m_openPens) {
            if (a.Kind != p.TargetKind) continue;
            float dist = Vector3.Distance(a.transform.position, p.transform.position);
            if (dist < closestDist) {
              closestDist = dist;
              closestPen = p;
            }
          }
        }
        if (closestPen != null) a.BeginMovingTowardsPen(closestPen);
        else a.BeginIdle();
      }
    }
  }

  public void DisplayResult(bool correct = true)
  {
    string message = (correct)? "Good Job!" : "Try Again";
    FinalFloatTextEffect.Show(message, FinalFloatTextEffect.transform.position);
  }
  
  void Update()
  {
    //RefreshHappiness();
    if (CreatureCountLabel != null) CreatureCountLabel.text = "Creatures: "+m_animals.Count;
  }
}

