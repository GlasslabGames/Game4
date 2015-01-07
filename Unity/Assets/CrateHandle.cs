using UnityEngine;
using System.Collections;

public class CrateHandle : MonoBehaviour {
	public enum Direction { Horizontal, Vertical };
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
			if (Draggable) m_dragging = true;
		} else {
			if (m_dragging) {
        m_dragging = false;
        Snap();
        m_crate.AdjustToHandles();
        m_crate.SetEdge(this);
      }
		}
	}

	void Update() {
		if (m_dragging) {
      float ts = m_crate.TileSize;
      Vector3 pos = this.transform.localPosition;
      Vector3 mousePos = UICamera.mainCamera.ScreenToWorldPoint(Input.mousePosition);
      mousePos = this.transform.parent.InverseTransformPoint(mousePos);

      if (EdgeDirection == Direction.Horizontal) {
        int row = Mathf.RoundToInt(mousePos.y / ts);
        row = m_crate.GetValidRow(this, row);
        pos.y = row * ts;
      } else {
        int col = Mathf.RoundToInt(mousePos.x / ts);
        col = m_crate.GetValidCol(this, col);
        pos.x = col * ts;
      }

      // Move gradually to the target position
      float dist = Vector3.Distance(this.transform.localPosition, pos);
      if (dist > 0.01) {
        pos = Vector3.Lerp(this.transform.localPosition, pos, 0.4f);

        this.transform.localPosition = pos;
        m_crate.AdjustToHandles();
      }
		}
	}

  void Snap() {
    float ts = m_crate.TileSize;
    Vector3 pos = this.transform.localPosition;
    if (EdgeDirection == Direction.Horizontal) {
      int row = Mathf.RoundToInt(pos.y / ts);
      pos.y = row * ts;
    } else {
      int col = Mathf.RoundToInt(pos.x / ts);
      pos.x = col * ts;
    }
    this.transform.localPosition = pos;
  }

  public void SetSize(int newSize) {
    if (EdgeDirection == Direction.Vertical) {
      m_texture.height = newSize;
    } else {
      m_texture.width = newSize;
    }
  }

	public void SetPosition(int x, int y, int newSize = -1) {
		Vector3 pos = transform.localPosition;
		pos.x = x;
		pos.y = y;
		transform.localPosition = pos;

		if (newSize > -1) SetSize(newSize);
	}
}
