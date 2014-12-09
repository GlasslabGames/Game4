using UnityEngine;
using TouchScript;
using TouchScript.Events;


public class TapToPan : MonoBehaviour
 {
	private Plane m_touchPlane = new Plane (Vector3.forward, Vector3.zero);

	private Vector2 startPosition;
	private Vector3 gameObjectStartPosition;

  private bool m_active = true;
  public bool Active {
    set {
      if (value != m_active) {
        if (value) {
          TouchManager.Instance.TouchesBegan += touchBeganHandler;
          TouchManager.Instance.TouchesMoved += touchMovedHandler;
        } else {
          TouchManager.Instance.TouchesBegan -= touchBeganHandler;
          TouchManager.Instance.TouchesMoved -= touchMovedHandler;
        }
      }
      m_active = value;
    }
  }

	private void Start()
	{
		TouchManager.Instance.TouchesBegan += touchBeganHandler;
		TouchManager.Instance.TouchesMoved += touchMovedHandler;
	}

  void OnDestroy() 
  {
    if (TouchManager.Instance != null) {
      TouchManager.Instance.TouchesBegan -= touchBeganHandler;
      TouchManager.Instance.TouchesMoved -= touchMovedHandler;
    }
  }

	private void touchBeganHandler(object sender, TouchEventArgs e)
	{
		// average them?
		Vector2 point = e.TouchPoints[0].Position;
		
		// Map the screen coordinates to world coordinates (in 3d world)
		Ray ray = Camera.main.ScreenPointToRay(new Vector3(point.x, point.y, 0));
		float distance;
		m_touchPlane.Raycast (ray, out distance);
		Vector2 position = ray.GetPoint (distance);

		startPosition = position;
		gameObjectStartPosition = gameObject.transform.position;
	}

	private void touchMovedHandler(object sender, TouchEventArgs e)
	{
		// average them?
		Vector2 point = e.TouchPoints[0].Position;

		// Map the screen coordinates to world coordinates (in 3d world)
		Ray ray = Camera.main.ScreenPointToRay(new Vector3(point.x, point.y, 0));
		float distance;
		m_touchPlane.Raycast (ray, out distance);
		Vector2 position = ray.GetPoint (distance);

		Vector3 newPosition = position - startPosition;
		gameObject.transform.position = gameObjectStartPosition - newPosition;
	}
}