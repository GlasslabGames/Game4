using UnityEngine;
using System.Collections;

public class CatchDroppedAnimalsForPen : MonoBehaviour {
  IsoPen m_pen;

	void Start () {
		GLDragDropContainer container = GetComponent<GLDragDropContainer>();
		container.ItemDropped += onItemDropped;
	}

  void onItemDropped(GLDragEventArgs args) {
    IsoPen m_pen = Utility.FirstAncestorOfType<IsoPen>(transform);
    m_pen.onItemDropped(args);
  }

}
