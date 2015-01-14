using UnityEngine;
using System.Collections;

public class ToggleGameObjects : MonoBehaviour {
	public bool On;
	public GameObject[] Objects;

	void Start() {
		foreach (GameObject o in Objects) {
			o.SetActive(On);
		}
	}

	public void Toggle() {
		On = !On;
		foreach (GameObject o in Objects) {
			o.SetActive(On);
		}
	}
}
