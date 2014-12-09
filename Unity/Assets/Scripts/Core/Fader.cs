using UnityEngine;
using System.ComponentModel;
using System.Collections;

public class Fader : MonoBehaviour {
  public enum FadeType {
    [Description ("Fade In")] FADEIN,
    [Description ("Fade Out")] FADEOUT,
  }

  // TODO: Add fade ranges, different fade patterns
  public FadeType m_fadeType = FadeType.FADEIN;
  public float m_delaySeconds = 0.0f;
  public float m_durationSeconds = 0.0f;
  public bool m_fadeGUITextures = true;
  public bool m_fadeGUIText = true;
  public bool m_fadeRenderers = true;
  public bool m_recursive = false;

  protected int m_fadeRunning = 0;


  protected void DoFade(GameObject go, Color color)
  {
    // We will do children first
    if (m_recursive) {
      foreach(Transform childTransform in go.transform) {
        DoFade(childTransform.gameObject, color);
      }
    }

    // If we're fading renderers, do it
    if (m_fadeRenderers && (go.renderer != null)) {
      go.renderer.material.color = color;
    }
    
    // If we're fading GUITextures, do it.
    if (m_fadeGUITextures && go.guiTexture != null) {
      go.guiTexture.color = color;
    }
    
    // If we're fading GUIText, do it.
    if (m_fadeGUIText && go.guiText != null) {
      go.guiTexture.color = color;
    }
  }

  IEnumerator Fade() {
    ++m_fadeRunning;

    // Wait the delay
    yield return new WaitForSeconds (m_delaySeconds);

    // Setup the fading
    Color color = new Color (0.5f, 0.5f, 0.5f, 0.5f);
    float elapsedTime = 0.0f;
    float interval = 1 / Application.targetFrameRate;
    float last_time = Time.time;
    float time;
    
    // Do the fading.
    while (elapsedTime < m_durationSeconds) {
      yield return new WaitForSeconds (interval);
      
      // Calculate actual time elapsed
      time = Time.time;
      elapsedTime += time - last_time;
      last_time = time;
      
      // Set the fade value based on our elapsed time vs desired time
      // NOTE: We multiply the denominator by 2 because our target color is 50%
      color.a = ((m_fadeType == FadeType.FADEIN) ? elapsedTime : m_durationSeconds-elapsedTime) / (2*m_durationSeconds);

      DoFade(gameObject, color);
    }

    // All done.
    --m_fadeRunning;
  }

	// Use this for initialization
	void Start () {
    StartCoroutine(Fade());
	}
	
	// Update is called once per frame
	void Update () {
	
	}

}
