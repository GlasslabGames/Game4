using UnityEngine;
using System.Collections;

public class IsoCrate : Crate {

	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}

  [ContextMenu ("RefreshSize")]
  public override void RefreshSize() {
    CenterHandle.SetPosition(0, 0);
    LeftHandle.SetPosition(-TileSize * LeftWidth, (int) (0.5f * TileSize * LeftWidth));
    TopHandle.SetPosition(LeftHandle.transform.localPosition);
    RightHandle.SetPosition(TileSize * RightWidth, (int) (-0.5f * TileSize * RightWidth));
    BottomHandle.SetPosition(
      (int) ( LeftHandle.transform.localPosition.x - TileSize * Height ),
      (int) ( LeftHandle.transform.localPosition.y - 0.5f * TileSize * Height )
      );

    AdjustToHandles();
  }

  // Adjust other components to match the currently moving handle. 
  public override void AdjustToHandles(CrateHandle currentHandle = null) {
    // top and bottom length: hypotenuse of left and right positions
    // left and right length: hypotenuse of top and bottom positions
    Vector3 left = LeftHandle.transform.localPosition;
    Vector3 right = RightHandle.transform.localPosition;
    Vector3 top = TopHandle.transform.localPosition;
    Vector3 bottom = BottomHandle.transform.localPosition;
    Vector3 center = CenterHandle.transform.localPosition;

    int topLength = (int) Vector3.Distance(left, right);
    int leftLength = (int) Vector3.Distance(top, bottom);

    TopHandle.SetSize(topLength);
    BottomHandle.SetSize(topLength);
    LeftHandle.SetSize(leftLength);
    RightHandle.SetSize(leftLength);
    CenterHandle.SetSize(leftLength);

    if (currentHandle == LeftHandle) {
      TopHandle.SetPosition(LeftHandle.transform.localPosition);
      BottomHandle.SetPosition(
        (int) ( left.x - TileSize * Height ),
        (int) ( left.y - 0.5f * TileSize * Height )
        );
    } else if (currentHandle == TopHandle) {
      // TODO... maybe
      /*LeftHandle.SetPosition( top );
      CenterHandle.SetPosition(
        (int) ( top.x + TileSize * LeftWidth ),
        (int) ( top.y + 0.5f * TileSize * LeftWidth )
        );
      RightHandle.SetPosition(
        (int) ( top.x + TileSize * (LeftWidth + RightWidth) ),
        (int) ( top.y + 0.5f * TileSize * (LeftWidth + RightWidth) )
        );
        */
    }

    //TopHandle.SetPosition(LeftHandle.transform.localPosition);

    /*
    LeftBackground.transform.localPosition = new Vector3(centerX, topY, 0);
    LeftBackground.width = centerX - leftX;
    LeftBackground.height = topY - bottomY;
    
    RightBackground.transform.localPosition = new Vector3(centerX, topY, 0);
    RightBackground.width = rightX - centerX;
    RightBackground.height = topY - bottomY;
    */
  }
}
