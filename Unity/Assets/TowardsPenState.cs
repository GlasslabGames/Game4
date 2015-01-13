//
// Idle.cs
// Author: Jerry Fu <jerry@glasslabgames.org>
// 2014 - 12 - 9

using UnityEngine;

public class TowardsPenState : AnimalBehaviorState
{
  public AnimalPen TargetPen;
  private static Vector3 VECTOR = new Vector3();
  private float m_size;

  public AnimalBehaviorState Initialize(Animal owner, AnimalPen pen)
  {
    TargetPen = pen;
    m_size = owner.GetComponent<SphereCollider>().radius / 250;
    return base.Initialize(owner);
  }

  override protected void enter()
  {
  }

  override protected void update()
  {
    if (TargetPen != null)
    {
      if (TargetPen.Animals.Count < TargetPen.MaxCount) {
     
        Vector3 displacement = VECTOR;
        float speed = owner.Speed / 300;
        Transform ownerTransform = owner.gameObject.transform;
        Vector3 center = TargetPen.collider.bounds.center;
        displacement.Set(center.x - ownerTransform.position.x, center.y - ownerTransform.position.y, 0); // distance from goal
        float magnitudeSquared = displacement.x * displacement.x + displacement.y * displacement.y + displacement.z * displacement.z;
        if (magnitudeSquared > speed * speed) // If further than our current speed. Checking squared numbers faster than taking square root.
        {
          float magnitude = Mathf.Sqrt(magnitudeSquared);
          displacement.x *= speed / magnitude;
          displacement.y *= speed / magnitude;
        }
        
        ownerTransform.position += displacement;

        // Really inefficiently, check if this intersects any handles attached to our target pen
        Collider[] hitColliders = Physics.OverlapSphere(owner.gameObject.transform.position, m_size);
        for (int i = 0; i < hitColliders.Length; i++) {
          CrateHandle handle = hitColliders[i].GetComponent<CrateHandle>();
          if (handle != null && handle.IsOnPen(TargetPen, ownerTransform.position)) {
            TargetPen.AddAnimal(owner);
          }
        }
      } else {
        owner.BeginIdle();
      }

    }
  }
}