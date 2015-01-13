//
// Idle.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 9

using UnityEngine;

public class TowardsFoodState : AnimalBehaviorState
{
  public Food TargetFood;
  private static Vector3 VECTOR = new Vector3();
  private Vector3 prevPosition;

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
    if (TargetFood != null)
    {
      Vector3 displacement = VECTOR;
      float speed = owner.Speed / 300;
      Transform ownerTransform = owner.gameObject.transform;
      displacement.Set(TargetFood.transform.position.x - ownerTransform.position.x, TargetFood.transform.position.y - ownerTransform.position.y, 0); // distance from goal
      float magnitudeSquared = displacement.x * displacement.x + displacement.y * displacement.y + displacement.z * displacement.z;
      if (magnitudeSquared > speed * speed) // If further than our current speed. Checking squared numbers faster than taking square root.
      {
        float magnitude = Mathf.Sqrt(magnitudeSquared);
        displacement.x *= speed / magnitude;
        displacement.y *= speed / magnitude;
      }
      
      ownerTransform.position += displacement;
      if (ownerTransform.position.AlmostEquals(TargetFood.transform.position, 0.01f))
      {
        Debug.Log (this+" start eating!");
        owner.StartEating(TargetFood);
      }
      prevPosition = ownerTransform.position;
    }
  }
}