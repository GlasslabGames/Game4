
using UnityEngine;
using System.Collections.Generic;
public sealed class RecycleManager : SingletonBehavior<RecycleManager> 
{
  private static readonly Dictionary<string, GameObject> m_objectDictionary = new Dictionary<string, GameObject>();
  private RecycleManager ()
  {
  }

  public void Recycle(GameObject obj)
  {
    obj.transform.parent = gameObject.transform;
    obj.SetActive (false);
  }

  public GameObject GetInstance(string prefabName)
  {
    GameObject obj;

    if (!m_objectDictionary.TryGetValue (prefabName, out obj)) {
      obj = (GameObject) Instantiate(Resources.Load (prefabName));
      m_objectDictionary.Add (prefabName, obj);
    }

    obj.SetActive (true);

    return obj;
  }
}

