using UnityEngine;
using System.Collections;

public abstract class UniqueMonoBehaviour : MonoBehaviour {
  #if UNITY_EDITOR
  void SingleComponentCheck() {
    var components = gameObject.GetComponents(this.GetType());
    
    foreach (var component in components) {
      if (component == this) continue;
      
      UnityEditor.EditorUtility.DisplayDialog("Can't add the same component multiple times!",
                                              string.Format("The component {0} can't be added because {1} already contains the same component.", this.GetType(), gameObject.name),
                                              "Cancel");
      
      DestroyImmediate(this);
    }
  }
  
  protected virtual void Reset() {
    Invoke("SingleComponentCheck",0);
  }
  #endif
}
