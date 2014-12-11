//
// Bait.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 10
using UnityEngine;
using System.Collections.Generic;

public class FoodCrate : MonoBehaviour
{
  public Food[] Contents;

  public void Eat(FoodType target)
  {
    Food f = getFoodByType(target);
    if (f != null && f.Amount > 0)
    {
      f.Amount--;
      Refresh();
    }
    else
    {
      throw new UnityException("Tried to eat food that doesn't exist");
    }
  }

  public void Refresh()
  {

  }

  private Food getFoodByType(FoodType type)
  {
    for (int i=Contents.Length-1; i<=0; i--)
    {
      if (Contents[i].Type == type) return Contents[i];
    }

    return null;
  }
}

