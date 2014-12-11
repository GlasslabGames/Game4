using UnityEngine;
using System.Collections;

public class AnimalThoughtBubble : MonoBehaviour {
  public Animal Owner;

  public UITexture Contents;

  // TODO: Act on event
  public void Update()
  {
    Refresh();
  }

  public void Refresh()
  {
    FoodType f = Owner.DesiredFood;
    if (f == FoodType.NONE)
    {
      Contents.gameObject.SetActive(false);
    }
    else
    {
      Contents.gameObject.SetActive(true);
      Contents.color = FoodTypeToColor(Owner.DesiredFood);
    }
  }

  public static Color FoodTypeToColor(FoodType f)
  {
    switch (f)
    {
      case FoodType.GREEN:
        return Color.green;
      case FoodType.BLUE:
        return Color.blue;
      case FoodType.RED:
        return Color.red;
      case FoodType.WHITE:
        return Color.white;
      default:
        return Color.black;
    }
  }
}
