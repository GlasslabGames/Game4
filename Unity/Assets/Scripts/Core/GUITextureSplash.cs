using UnityEngine;
using System.Collections;

// TODO: move the fading to another object that will work on an entire gameobject.
[RequireComponent(typeof(GUITexture))]
public class GUITextureSplash : MonoBehaviour {

  public enum ScaleToType {
    HEIGHT,
    WIDTH,
    SCALE_TO_FILL_AND_CROP,
    SCALE_TO_FIT_AND_LETTERBOX
  }

  public ScaleToType m_scaleTo;

  // Use this for initialization
	void Start () {
    FixTransform (Screen.width, Screen.height);
  }
	
	// Update is called once per frame
	void Update () {
	}

  public void FixTransform(int screenWidth, int screenHeight)
  {
    // Do not run if we are disabled
    if (!enabled) {
      return;
    }

    GUITexture guiTexture = GetComponent<GUITexture> ();
    if (guiTexture == null) {
      // TODO: WARN
      return;
    }

    if (guiTexture.texture == null) {
      // TODO: WARN
      return;
    }
    
    // Position the billboard in the center, but respect the picture aspect ratio
    int textureHeight = guiTexture.texture.height;
    int textureWidth = guiTexture.texture.width;
    
    int screenAspectRatio = (screenWidth / screenHeight);
    int textureAspectRatio = (textureWidth / textureHeight);
    
    int scaledHeight;
    int scaledWidth;

    ScaleToType scaleTo = m_scaleTo;
    if (scaleTo == ScaleToType.SCALE_TO_FIT_AND_LETTERBOX) {
      scaleTo = (textureAspectRatio <= screenAspectRatio) ? ScaleToType.HEIGHT : ScaleToType.WIDTH;
    } else if (scaleTo == ScaleToType.SCALE_TO_FILL_AND_CROP) {
      scaleTo = (textureAspectRatio <= screenAspectRatio) ? ScaleToType.WIDTH : ScaleToType.HEIGHT;
    }

    if (scaleTo == ScaleToType.HEIGHT) {
      // The scaled size is based on the height
      scaledHeight = screenHeight;
      scaledWidth = (screenHeight * textureAspectRatio);
    } else { //if (scaleTo == ScaleToType.WIDTH) {
      // The scaled size is based on the width
      scaledWidth = screenWidth;
      scaledHeight = (scaledWidth / textureAspectRatio);
    }

    float xPosition = (screenWidth / 2) - (scaledWidth / 2);
    float yPosition = (screenHeight / 2) - (scaledHeight / 2);
    guiTexture.pixelInset = new Rect(xPosition, yPosition, scaledWidth, scaledHeight);
    //Debug.Log (string.Format ("Scaling to: {0}, Screen: {1}x{2}, Texture: {3}x{4}, ScaledTo: {5}x{6}, Location: {7}x{8}", scaleTo.ToString(), screenWidth, screenHeight, textureWidth, textureHeight, scaledWidth, scaledHeight, xPosition, yPosition));
  }
}
