using UnityEngine;
using System.Collections;

[RequireComponent(typeof(BoxCollider))]
public class CollidableBasedOnUIInputHasValue : MonoBehaviour {
  public UIInput m_UIInputToWatch;
  private BoxCollider m_collider;

	// Use this for initialization
	void Start () {
    m_collider = GetComponent<BoxCollider>();
    m_UIInputToWatch.onValidate += OnTextChange;
    m_collider.enabled = false;
    m_UIInputToWatch.value = "";
	}
	
	// Update is called once per frame
	void Update () {
	
	}

  char OnTextChange (string text, int charIndex, char addedChar)
  {
    m_collider.enabled = (text != "");
    return addedChar;
  }
}
