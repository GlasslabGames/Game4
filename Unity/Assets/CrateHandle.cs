using UnityEngine;
using System.Collections;

public class CrateHandle : MonoBehaviour {
	public enum Direction { Horizontal, Vertical, IsoLeft, IsoRight };
	public Direction EdgeDirection;
	public bool Draggable;
  private UITexture m_texture;
	private Crate m_crate;

	// rewrite our own Drag&Drop stuff so we can control snapping, etc precisely
	private bool m_dragging;

	void Awake() {
		m_texture = GetComponent<UITexture>();
    m_crate = Utility.FirstAncestorOfType<Crate>(transform);
	}

	void OnPress(bool down) {
		//Debug.Log ("onPress "+down);
		if (down) {
			if (Draggable && m_crate.Resizable && !m_dragging) {
        m_crate.StartResizing();
        m_dragging = true;
      }
		} else {
			if (m_dragging) {
        m_dragging = false;
        Snap();
        m_crate.AdjustToHandles(this);
        m_crate.StopResizing();
        m_crate.SetEdge(this);
      }
		}
	}
  /*
  void OnHover(bool over) {
    if (Draggable && m_crate.Resizable) {
      m_texture.color = (over)? Color.yellow : Color.black;
    }
  }
  */

	void Update() {
		if (m_dragging) {
      float ts = m_crate.TileSize;
      Vector3 pos = this.transform.localPosition;
      Vector3 mousePos = UICamera.mainCamera.ScreenToWorldPoint(Input.mousePosition);
      mousePos = this.transform.parent.InverseTransformPoint(mousePos);

      //Debug.Log(mousePos);

      if (EdgeDirection == Direction.Horizontal) { // direction: -
        int row = Mathf.RoundToInt(mousePos.y / ts);
        row = m_crate.GetValidRow(this, row);
        pos.y = row * ts;
      } else if (EdgeDirection == Direction.Vertical) { // direction: |
        int col = Mathf.RoundToInt(mousePos.x / ts);
        col = m_crate.GetValidCol(this, col);
        pos.x = col * ts;
      } else if (EdgeDirection == Direction.IsoLeft) { // direction: /
        int col = Mathf.RoundToInt( (mousePos.y / (0.5f*ts) - mousePos.x / ts) / -2 );
        col = m_crate.GetValidCol(this, col);
        pos.x = col * ts;
        pos.y = -0.5f * col * ts;
      } else if (EdgeDirection == Direction.IsoRight) { // direction: \
        int row = Mathf.RoundToInt( (mousePos.y / (0.5f*ts) + mousePos.x / ts) / 2 );
        row = m_crate.GetValidRow(this, row);
        Vector3 leftPos = m_crate.LeftHandle.transform.localPosition;
        pos.x = leftPos.x + (row * ts);
        pos.y = leftPos.y + (0.5f * row * ts);
      }


      // Move gradually to the target position
      float dist = Vector3.Distance(this.transform.localPosition, pos);
      if (dist > 0.01) {
        pos = Vector3.Lerp(this.transform.localPosition, pos, 0.4f);

        this.transform.localPosition = pos;
        m_crate.AdjustToHandles(this);
      }
		}
    if (Draggable && m_crate.Resizable) {
      if (UICamera.hoveredObject == this.gameObject && GLDragDropItem.CurrentlyDragging == null) {
        m_texture.color = Color.yellow;
      } else {
        m_texture.color = Color.black;
      }
    }
	}

  void Snap() {
    float halfTileSize = m_crate.TileSize / 2; // use half tilesize for the isometric
    Vector3 pos = this.transform.localPosition;

    pos.y = Mathf.Round(pos.y / halfTileSize) * halfTileSize;
    pos.x = Mathf.Round(pos.x / halfTileSize) * halfTileSize;

    this.transform.localPosition = pos;
  }

  public void SetSize(int newSize) {
    if (m_texture == null) return;
    if (EdgeDirection == Direction.Vertical || EdgeDirection == Direction.IsoLeft) {
      m_texture.height = newSize;
    } else {
      m_texture.width = newSize;
    }
  }

  public void SetPosition(Vector3 target) {
    Vector3 pos = transform.localPosition;
    pos.x = (int) target.x;
    pos.y = (int) target.y;
    transform.localPosition = pos;
  }

	public void SetPosition(int x, int y, int newSize = -1) {
		Vector3 pos = transform.localPosition;
		pos.x = x;
		pos.y = y;
		transform.localPosition = pos;

		if (newSize > -1) SetSize(newSize);
	}

  public bool IsOnPen(AnimalPen pen, Vector3 atPosition) {
    if (pen == m_crate.LeftPen && (this == m_crate.LeftHandle || this == m_crate.CenterHandle)) return true;
    else if (pen == m_crate.RightPen && (this == m_crate.RightHandle || this == m_crate.CenterHandle)) return true;
    else if (this == m_crate.TopHandle || this == m_crate.BottomHandle) {
      Vector3 center = m_crate.CenterHandle.transform.position;
      if (pen == m_crate.LeftPen && atPosition.x <= center.x) return true;
      else if (pen == m_crate.RightPen && atPosition.x >= center.x) return true;
      else return false;
    } else return false;
  }

  public int GetRow() {
    Vector3 pos = transform.localPosition;
    if (EdgeDirection == Direction.Horizontal || EdgeDirection == Direction.Vertical) {
      return Mathf.RoundToInt (pos.y / m_crate.TileSize);
    } else { // isometric
      return Mathf.RoundToInt( (pos.y / (0.5f*m_crate.TileSize) + pos.x / m_crate.TileSize) / 2 );
    }
  }

  public int GetCol() {
    Vector3 pos = transform.localPosition;
    if (EdgeDirection == Direction.Horizontal || EdgeDirection == Direction.Vertical) {
      return Mathf.RoundToInt (pos.x / m_crate.TileSize);
    } else { // isometric
      return Mathf.RoundToInt( (pos.y / (0.5f*m_crate.TileSize) - pos.x / m_crate.TileSize) / -2 );
    }
  }
}
