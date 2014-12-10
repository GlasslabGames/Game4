using UnityEngine;
using System.Collections;
using System;

public class Animal : MonoBehaviour {
  public float Speed;

  public float TurnSpeed; // Degrees per sec

  public GameObject Target;

  private AnimalBehaviorState m_currentState;

  public Vector2 TargetPoint;
  private float m_idleTime;

  void Awake()
  {
    BeginIdle();
  }

  public void BeginIdle()
  {
    Target = null;
    m_currentState = new Idle().Initialize(this);
  }

  void Update()
  {
    if (m_currentState != null)
    {
      m_currentState.Do();
    }
  }
}
