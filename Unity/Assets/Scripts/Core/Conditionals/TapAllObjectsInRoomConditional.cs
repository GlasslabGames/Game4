using UnityEngine;
public class TapAllObjectsInRoomConditional : Conditional
{
  public TapAllObjectsInRoomConditional()
  {
    SignalManager.ExplorationObjectTapped += onObjectTapped;
  }

  private void onObjectTapped(GameObject obj)
  {
    Refresh();
  }

  override protected bool CalculateIsSatisfied()
  {
    if (ExplorationManager.Instance.m_unTappedRoomObjects != null)
    {
      int total = ExplorationManager.Instance.m_unTappedRoomObjects.Count;
      if (total != 0)
      {
        //string objString = "";
        foreach (GameObject obj in ExplorationManager.Instance.m_unTappedRoomObjects)
        {
          if (obj == null)
          {
            Debug.LogWarning("There was a null object in m_unTappedRoomObjects.");
            total--;
            continue;
          }

          SpriteRenderer[] spriteRenderers = obj.GetComponentsInChildren<SpriteRenderer>(true);
          for (int rIndex = spriteRenderers.Length-1; rIndex>=0; rIndex--)
          {
            SpriteRenderer r = spriteRenderers[rIndex];
            if ((!r.gameObject.activeInHierarchy || !r.enabled) && (r.transform == obj.transform || r.transform.parent == obj.transform))
            {
              total--;
              break;
            }
          }
          
          //objString += ", "+obj.name;
        }
        //Debug.Log("Objects left " + total + objString);
      }
      return total == 0;
    }
    else
    {
      return false; // If there's no list yet, you can't have completed it!
    }
  }

  ~TapAllObjectsInRoomConditional()
  {
    SignalManager.ExplorationObjectTapped -= onObjectTapped;
  }
}