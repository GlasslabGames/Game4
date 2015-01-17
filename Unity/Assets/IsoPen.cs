using UnityEngine;
using System.Collections.Generic;

public class IsoPen : AnimalPen {
  public bool flipFill;

	public void Resize() {
		List<Transform> tiles = new List<Transform>( GetComponentsInChildren<Transform>(true) );
    tiles = tiles.FindAll( x => (x.parent == transform && x.GetComponent<Animal>() == null) );
		GameObject tileObject = tiles[0].gameObject;
		int cols = (ParentCrate.LeftPen == this)? ParentCrate.LeftWidth : ParentCrate.RightWidth;
		int rows = ParentCrate.Height;
		for (int col = 0; col < cols; col++) {
			for (int row = 0; row < rows; row++) {
				Transform tile;
				if (tiles.Count > 0) {
					tile = tiles[0];
          tile.gameObject.SetActive(true);
					tiles.RemoveAt(0); // pop it from the list
				} else { // make a new one
					tile = Utility.InstantiateAsChild(tileObject, transform).transform;
				}
        int c = (flipFill)? -col : col;
				tile.transform.localPosition = new Vector3(
					(-row + c) * ParentCrate.TileSize,
					(-row - c) * ParentCrate.TileSize * 0.5f
					);
			}
		}
    foreach (Transform t in tiles) { // if there are any unused ones left
      t.gameObject.SetActive(false); // hide them
    }
	}
}
