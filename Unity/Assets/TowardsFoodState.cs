//
// Idle.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 9

using UnityEngine;

public class TowardsFoodState : AnimalBehaviorState
{
  Food m_target;

  public AnimalBehaviorState Initialize(Animal owner, Food food)
  {
    m_target = food;
    return base.Initialize(owner);
  }

  override protected void enter()
  {
  }

  override protected void update()
  {
  }
}