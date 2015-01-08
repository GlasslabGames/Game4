using UnityEngine;
using System.Collections;

public class Crate : MonoBehaviour {
	public int TileSize;
	public bool Resizable;
  public int MaxWidth;
  public int MaxHeight;

  public int TargetRatioTerm1;
  public int TargetRatioTerm2;
  private float m_targetQuotient;

  private bool m_changed;
  private bool m_satisfied;
  public bool WinWhenSatisfied;

	// there are leftWidth * height creatures on the left, and rightWidth * height creatures on the right
	public int LeftWidth;
	public int RightWidth;
	public int Height;

	// the handles that the player can drag to adjust the crate size
	public CrateHandle LeftHandle;
	public CrateHandle RightHandle;
	public CrateHandle CenterHandle;
	public CrateHandle TopHandle;
	public CrateHandle BottomHandle;

	// the backgrounds that also need to be resized
	public UITexture LeftBackground;
	public UITexture RightBackground;

  public AnimalPen LeftPen;
  public AnimalPen RightPen;

  // the labels that count how much space there is on each side
  public UILabel LeftLabel;
  public UILabel RightLabel;

  private int m_leftCount;
  private int m_rightCount;

	void Start() {
		RefreshSize();
    m_targetQuotient = (float) TargetRatioTerm1 / TargetRatioTerm2;
	}

  void Update() {
    if (m_changed) CheckRatio(); // do this once a frame only if somehting about this crate actually changed
    m_changed = false;
  }

  // if this col would make the crate too large or too small, return an acceptable col
  public int GetValidCol(CrateHandle h, int col) {
    int leftCol = Mathf.RoundToInt (LeftHandle.transform.localPosition.x / TileSize);
    int rightCol = Mathf.RoundToInt (RightHandle.transform.localPosition.x / TileSize);

    if (h == LeftHandle) {
      return Mathf.Clamp(col, rightCol - MaxWidth, -1); // since the center is at 0, the max row is -1
    } else if (h == RightHandle) {
      return Mathf.Clamp (col, 1, leftCol + MaxWidth); // since the center is at 0, the min row is 1
    } else { // if (h == CenterHandle)
      return Mathf.Clamp(col, leftCol + 1, rightCol - 1);
    }
  }

  public int GetValidRow(CrateHandle h, int row) {
    if (h == TopHandle) {
      int bottomRow = Mathf.RoundToInt (BottomHandle.transform.localPosition.y / TileSize);
      return Mathf.Clamp(row, bottomRow + 1, bottomRow + MaxHeight);
    } else { // BottomHandle
      int topRow = Mathf.RoundToInt (TopHandle.transform.localPosition.y / TileSize);
      return Mathf.Clamp(row, topRow - MaxHeight, topRow - 1);
    }
  }

  // when they drop a handle, update counts
  public void SetEdge(CrateHandle h) {
    if (h == TopHandle || h == BottomHandle) {
      Height = Mathf.RoundToInt((TopHandle.transform.localPosition.y - BottomHandle.transform.localPosition.y) / TileSize);
    } else {
      LeftWidth = Mathf.RoundToInt((CenterHandle.transform.localPosition.x - LeftHandle.transform.localPosition.x) / TileSize);
      RightWidth = Mathf.RoundToInt((RightHandle.transform.localPosition.x - CenterHandle.transform.localPosition.x) / TileSize);
    }
    Debug.Log ("Left: "+LeftWidth+" Right: "+RightWidth+" Height: "+Height);
    // Now move the whole shape so that we end up centered on the apparent top-center
    transform.position = CenterHandle.transform.position;
    RefreshSize();
  }

  public void UpdateCreatureCount(Animal.Kinds kind, int count) {
    // Equating left and right directly with animal kinds is a little hacky
    if (kind == Animal.Kinds.RED) m_leftCount = count;
    else m_rightCount = count;
    RefreshText();
    m_changed = true;
  }

  private void RefreshText() {
    LeftLabel.text = m_leftCount+"/"+(LeftWidth*Height).ToString(); // TODO: use number of creatures
    RightLabel.text = m_rightCount+"/"+(RightWidth*Height).ToString(); // TODO: use number of creatures
  }

	// adjusts components to reflect the current width and height. Note that this will move the whole shape...
	[ContextMenu ("RefreshSize")]
	public void RefreshSize() {
		LeftHandle.SetPosition(-LeftWidth * TileSize, 0);
    RightHandle.SetPosition(RightWidth * TileSize, 0);
		CenterHandle.SetPosition(0, 0);
    TopHandle.SetPosition(-LeftWidth * TileSize, 0);
		BottomHandle.SetPosition(-LeftWidth * TileSize, -Height * TileSize);
    AdjustToHandles();

    LeftPen.MaxCount = LeftWidth * Height;
    RightPen.MaxCount = RightWidth * Height;

    // Fix which creatures are in or out of the crate
    LeftPen.UpdateCreatures();
    RightPen.UpdateCreatures();
     
    RefreshText();
    m_changed = true;
	}

  // Adjust other components to match the currently moving handle. 
  public void AdjustToHandles() {
    int leftX = (int) LeftHandle.transform.localPosition.x;
    int rightX = (int) RightHandle.transform.localPosition.x;
    int topY = (int) TopHandle.transform.localPosition.y;
    int bottomY = (int) BottomHandle.transform.localPosition.y;
    int centerX = (int) CenterHandle.transform.localPosition.x;

    TopHandle.SetPosition(leftX, topY, rightX - leftX);
    BottomHandle.SetPosition(leftX, bottomY, rightX - leftX);
    LeftHandle.SetPosition(leftX, topY, topY - bottomY);
    RightHandle.SetPosition(rightX, topY, topY - bottomY);
    CenterHandle.SetPosition(centerX, topY, topY - bottomY);

    LeftBackground.transform.localPosition = new Vector3(centerX, topY, 0);
    LeftBackground.width = centerX - leftX;
    LeftBackground.height = topY - bottomY;

    RightBackground.transform.localPosition = new Vector3(centerX, topY, 0);
    RightBackground.width = rightX - centerX;
    RightBackground.height = topY - bottomY;
  }

  public void CheckRatio() {
    // To succeed, each side must be filled in and the ratio must be correct
    float quotient = (float) LeftPen.Animals.Count / RightPen.Animals.Count;
    if (LeftPen.Animals.Count == LeftPen.MaxCount && RightPen.Animals.Count == RightPen.MaxCount && quotient == m_targetQuotient) {
      m_satisfied = true;
      Debug.Log(this+"satisfied!");
      if (WinWhenSatisfied) AnimalManager.Instance.DisplayResult();
    }
  }
}
