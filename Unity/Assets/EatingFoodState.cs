//
// Idle.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 9

using UnityEngine;

public class EatingFoodState : AnimalBehaviorState
{
  public Food TargetFood;

  public AnimalBehaviorState Initialize(Animal owner, Food food)
  {
    TargetFood = food;
    return base.Initialize(owner);
  }

  override protected void enter()
  {
  }

  override protected void update()
  {
    if (TargetFood != null) TargetFood.Bite();
  }
}