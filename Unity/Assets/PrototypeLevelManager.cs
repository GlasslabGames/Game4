using UnityEngine;
using System.Collections;

public class PrototypeLevelManager : MonoBehaviour {
  public Crate SadCrate;
	public Crate HappyCrate1;
	public Crate HappyCrate2;

	void Awake() {
    // Resize and add creatures to the happy crates
		int randHeight1 = UnityEngine.Random.Range(2, 5);
		int randHeight2 = UnityEngine.Random.Range(2, 5);
		while (randHeight1 == randHeight2) { // technically this could run infinitely but it won't.
			randHeight2 = UnityEngine.Random.Range(2, 5);
		}

		Debug.Log ("Random height 1: "+randHeight1+" Random height 2: "+randHeight2);

		HappyCrate1.Height = randHeight1;
		HappyCrate1.LeftPen.InitialAnimalCounts = new int[] {randHeight1 * HappyCrate1.LeftWidth, 0};
		HappyCrate1.RightPen.InitialAnimalCounts = new int[] {0, randHeight1 * HappyCrate1.RightWidth};

		HappyCrate2.Height = randHeight2;
		HappyCrate2.LeftPen.InitialAnimalCounts = new int[] {randHeight2 * HappyCrate2.LeftWidth, 0};
		HappyCrate2.RightPen.InitialAnimalCounts = new int[] {0, randHeight2 * HappyCrate2.RightWidth};

    // Add creatures to the sad crate
    int randCount = UnityEngine.Random.Range (1, 4);
    // Add it to either the right or left randomly
    if (UnityEngine.Random.value > 0.5) {
      SadCrate.LeftPen.InitialAnimalCounts = new int[] {randCount, 0};
    } else {
      SadCrate.RightPen.InitialAnimalCounts = new int[] {0, randCount};
    }

	}
}
