using UnityEngine;
using System.Collections;

public class SaveSpinner : MonoBehaviour {
  UIAnchor m_anchor;
  TweenAlpha m_alphaTween;

	// Use this for initialization
  void Awake () {
    m_anchor = GetComponent<UIAnchor>();
    m_alphaTween = GetComponent<TweenAlpha>();
    m_alphaTween.Reset();
	}
	
	// Update is called once per frame
	void Update () {
    transform.Rotate(0, 0, -2.5f);
	}

  void OnEnable()
  {
    m_anchor.uiCamera = UICamera.mainCamera;
    m_anchor.enabled = true;

    m_alphaTween.PlayForward();
  }

  void OnDisable()
  {
    m_alphaTween.Reset();
  }
}
