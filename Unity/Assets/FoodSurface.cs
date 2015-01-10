using UnityEngine;
using System.Collections;

public class FoodSurface : MonoBehaviour {

  void Awake() {
    GetComponent<GLDragDropContainer>().ItemDropped += onItemDropped;
  }

	public void onItemDropped(GLDragEventArgs args)
	{
    Food food = args.DragObject.GetComponent<Food>();
		if (food != null) {
			args.Consume();
      AnimalManager.Instance.DropFood(food);
      args.DragObject.enabled = false; // so that you can't pick the food up again
		}
	}
}
