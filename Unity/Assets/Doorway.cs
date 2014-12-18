using UnityEngine;
using System.Collections.Generic;

public class Doorway : MonoBehaviour {
  public AnimalPen FromPen;
  public AnimalPen ToPen;

  public GameObject Door;

	public void OpenDoor() {
    Door.SetActive(false);
    Debug.Log (this+" opened!");
    FromPen.Locked = true;

    MoveAnimal();
  }

  private void MoveAnimal() {
    if (FromPen.Animals.Count <= 0) {
      Utility.Delay( delegate { ToPen.RefreshCount(true); }, 0.5f);
    } else {
      Animal a = FromPen.Animals[0];
      FromPen.RemoveAnimal(a);
      ToPen.AddAnimal(a);
      Bounds b = ToPen.collider.bounds;
      Vector3 pos = new Vector3( Random.Range(b.min.x + 0.1f, b.max.x - 0.1f), Random.Range(b.min.y + 0.1f, b.max.y - 0.1f));
      //TweenPosition tp = TweenPosition.Begin(a.gameObject, 1f, a.transform.InverseTransformPoint(pos));
      a.transform.position = pos;
      Utility.Delay(MoveAnimal, 0.25f);
    }
  }
}
