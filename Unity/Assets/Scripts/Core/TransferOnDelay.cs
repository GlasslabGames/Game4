using UnityEngine;
using System.Collections;

public class TransferOnDelay : MonoBehaviour {

  public float m_delaySeconds;
  [SceneName(SceneNameAttribute.Flags.HIDE_CURRENT)]
  public string m_transferState;

  IEnumerator Transfer() {
    // Wait the delay
    yield return new WaitForSeconds (m_delaySeconds);
    
    Application.LoadLevel(m_transferState);
  }


	// Use this for initialization
	void Start () {
    StartCoroutine(Transfer());
	}
	
	// Update is called once per frame
	void Update () {
	
	}
}
