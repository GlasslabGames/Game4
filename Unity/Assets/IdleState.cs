//
// Idle.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 9

using UnityEngine;

public class IdleState : AnimalBehaviorState
{
  public Vector3 m_targetPosition = new Vector3(float.NaN, 0, 0);
  private float m_waitTime;
  private const float MIN_WAIT_TIME = 0.5f;
  private const float MAX_WAIT_TIME = 2f;
  private static Vector3 VECTOR = new Vector3();
  private Vector3 prevPosition;

  override protected void enter()
  {
  }

  override protected void update()
  {
    if (!float.IsNaN(m_targetPosition.x))
    {
      Vector3 displacement = VECTOR;
      Transform ownerTransform = owner.gameObject.transform;
      displacement.Set(m_targetPosition.x - ownerTransform.localPosition.x, m_targetPosition.y - ownerTransform.localPosition.y, m_targetPosition.z - ownerTransform.localPosition.z); // distance from goal
      float magnitudeSquared = displacement.x * displacement.x + displacement.y * displacement.y + displacement.z * displacement.z;
      if (magnitudeSquared > owner.Speed * owner.Speed) // If further than our current speed. Checking squared numbers faster than taking square root.
      {
        float magnitude = Mathf.Sqrt(magnitudeSquared);
        displacement.x *= owner.Speed / magnitude;
        displacement.y *= owner.Speed / magnitude;
      }
      
      ownerTransform.localPosition += displacement;
      if (ownerTransform.localPosition.AlmostEquals(m_targetPosition, 0.001f))
      {
        PauseWandering(); // take a break before wandering elsewhere
      } else if (ownerTransform.localPosition.AlmostEquals(prevPosition, 0.01f)) { // we must be stuck, so try the other direction
        WanderAwayFrom( owner.transform.TransformPoint (m_targetPosition) );
      }
      prevPosition = ownerTransform.localPosition;
    }
    else
    {
      m_waitTime -= Time.deltaTime;
      if (m_waitTime <= 0)
      {
        getNewWanderPosition();
      }
    }
  }

  private void getNewWanderPosition()
  {
    GameObject ownerObject = owner.gameObject;
    m_targetPosition.Set(
      ownerObject.transform.localPosition.x + Random.Range(-50, 50),
      owner.transform.localPosition.y + Random.Range(-50, 50),
      0);
  }

  // These shouldn't really be in Idle, but this is all hacky anyway
  public void PauseWandering() {
    m_targetPosition.x = float.NaN;
    m_waitTime = Random.Range (MIN_WAIT_TIME, MAX_WAIT_TIME);
  }

  public void WanderAwayFrom( Vector3 pos ) {
    m_targetPosition = owner.transform.localPosition;
    if (pos.x < owner.transform.position.x) {
      m_targetPosition.x += Random.Range(5, 30);
    } else {
      m_targetPosition.x -= Random.Range(5, 30);
    }
    if (pos.y < owner.transform.position.y) {
      m_targetPosition.y += Random.Range(5, 30);
    } else {
      m_targetPosition.y -= Random.Range(5, 30);
    }
    //Debug.Log (owner.name+" avoiding "+pos+" to "+m_targetPosition);
  }
}