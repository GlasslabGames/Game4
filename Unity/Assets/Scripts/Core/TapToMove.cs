using UnityEngine;
using TouchScript;
using TouchScript.Events;

[RequireComponent(typeof(Rigidbody2D))]
[RequireComponent(typeof(Animator))]
public class TapToMove : MonoBehaviour
{
	public float m_maxSpeed = 5f;
	public float m_moveForce = 365f;
	public float m_slowRange = 3f; 
	public bool m_facingRight = true;
	
	private static readonly Vector2 ms_lookDownDistance = new Vector2(0, -100);
	private Plane m_touchPlane = new Plane (Vector3.forward, Vector3.zero);
	private Vector2 m_target;
	private Animator m_animator;

	private void Start()
	{
		TouchManager.Instance.TouchesBegan += touchBeganHandler;
		m_animator = GetComponent<Animator>();
	}
	
	private void touchBeganHandler(object sender, TouchEventArgs e)
	{
		// average them?
		Vector2 point = e.TouchPoints[0].Position;

		// Map the screen coordinates to world coordinates (in 3d world)
		Ray ray = Camera.main.ScreenPointToRay(new Vector3(point.x, point.y, 0));
		float distance;
		m_touchPlane.Raycast (ray, out distance);
		Vector2 position = ray.GetPoint (distance);

		// Raycast to the ground to find where we're trying to go in 2d world.
		RaycastHit2D raycastHit = Physics2D.Raycast(position, ms_lookDownDistance, 1 << LayerMask.NameToLayer("Ground"));  

		// Move toward the raycastHit
		// Move at our maximum rate of speet until we reach our destination
		m_target = raycastHit.point;

		Debug.Log ("Point clicked from: " + point + "/" + position + ", Moving from " + gameObject.transform.position + " to " + raycastHit.point);
	}

	private void FixedUpdate()
	{
		float xDelta = m_target.x - gameObject.transform.position.x;
		float xDeltaAbs = Mathf.Abs (xDelta);
		// If we are within our margin of error of the target, we don't need to do anything.

		float movementDirection = Mathf.Clamp (xDelta, -1, 1);
		// If the player is approaching the destination, slow us down
		if (xDeltaAbs < m_slowRange) {
			movementDirection = 0;//*= (xDeltaAbs / m_slowRange);
		}

		//Debug.Log ("MovementDirection: " + movementDirection);
		// The Speed animator parameter is set to the absolute value of the horizontal input.
		m_animator.SetFloat("Speed", Mathf.Abs(movementDirection));
		
		// If the player is changing direction (h has a different sign to velocity.x) or hasn't reached maxSpeed yet...
		if(movementDirection * rigidbody2D.velocity.x < m_maxSpeed) {
			// ... add a force to the player.
			rigidbody2D.AddForce(Vector2.right * movementDirection * m_moveForce);
		}
		
		// If the player's horizontal velocity is greater than the maxSpeed...
		if(Mathf.Abs(rigidbody2D.velocity.x) > m_maxSpeed) {
			// ... set the player's velocity to the maxSpeed in the x axis.
			rigidbody2D.velocity = new Vector2(Mathf.Sign(rigidbody2D.velocity.x) * m_maxSpeed, rigidbody2D.velocity.y);
		}


		
		// Flip the sprite if it is not facing the right way.
		if((movementDirection > 0 && !m_facingRight) || (movementDirection < 0 && m_facingRight)) {
			// Switch the way the player is labelled as facing.
			m_facingRight = !m_facingRight;
		
			// Multiply the player's x local scale by -1.
			Vector3 theScale = transform.localScale;
			theScale.x *= -1;
			transform.localScale = theScale;
			// Otherwise if the input is moving the player left and the player is facing right...
		}

		m_animator.speed = Mathf.Abs(rigidbody2D.velocity.x/m_maxSpeed);
	}
}