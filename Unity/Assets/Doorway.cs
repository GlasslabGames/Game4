using UnityEngine;
using System.Collections;

public class Doorway : MonoBehaviour {
  public AnimalPen FromPen;
  public AnimalPen ToPen;

  public GameObject Door;

	public void OpenDoor() {
    Door.SetActive(false);
    Debug.Log (this+" opened!");
    //TODO: send creatures into the next pen
  }
}
