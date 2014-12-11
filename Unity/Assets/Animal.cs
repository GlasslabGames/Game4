using UnityEngine;
using System.Collections;
using System;

public class Animal : MonoBehaviour {
  public float Speed;

  public float TurnSpeed; // Degrees per sec

  public GameObject Target;

  public FoodType DesiredFood;

  public bool Happy;

  private AnimalBehaviorState m_currentState;

  public Vector2 TargetPoint;
  private float m_idleTime;

  private GLDragDropContainer m_container;

  void Awake()
  {
    BeginIdle();

    m_container = GetComponent<GLDragDropContainer>();
    m_container.ItemDropped += onItemDropped;
  }

  private void onItemDropped(GLDragEventArgs args)
  {
    Debug.Log(args.DragObject.name);
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
