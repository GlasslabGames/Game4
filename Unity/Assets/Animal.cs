﻿using UnityEngine;
using System.Collections.Generic;
using System;

public class Animal : MonoBehaviour {
  public enum Kinds { RED, BLUE, KINDS_FINAL };
  public Kinds Kind;
  public float Speed;

  public float TurnSpeed; // Degrees per sec

  public GameObject Target;

  public FoodType DesiredFood;

  public enum Moods { NEUTRAL, HAPPY, SAD };
  public Moods Mood;

  private AnimalBehaviorState m_currentState; // hacky but we're only using Idle now anyway
  public AnimalBehaviorState CurrentState { get { return m_currentState; } }

  private float m_idleTime;

  private GLDragDropContainer m_container;

  public UITexture BodyTexture;
  public UITexture AngryTexture;
  public UITexture[] ClosedEyes;
  public UITexture[] Eyelids;

  public AnimalPen InPen;
  public bool TriedToDropInLockedPen;
  private Vector3 m_outOfPenPosition;

  private bool m_dragging;


  void Awake()
  {
    BeginIdle();

    m_container = GetComponent<GLDragDropContainer>();
    m_container.ItemDropped += onItemDropped;

    GLDragDropItem ddi = GetComponent<GLDragDropItem>();
    ddi.OnDropped += onDropped;
    ddi.OnDragStarted += onDragged;
  }

  private void onItemDropped(GLDragEventArgs args)
  {
    Debug.Log(args.DragObject.name);
    if (args.DragObject.GetComponent<Potion>() != null && InPen == null) { // don't split if we're in a pen
      Debug.Log ("Dropped potion");
      AnimalManager.Instance.Split(this, 3);
      GameObject.Destroy(args.DragObject.gameObject);
    } else if (InPen != null && args.DragObject.GetComponent<Animal>() != null) {
      InPen.onItemDropped(args); // pass along the event
    }
  }

  // onItemTaken doesn't work so we're doing this here ¯\_(ツ)_/¯
  private void onDragged(GLDragEventArgs args) {
    if (InPen != null) {
      InPen.RemoveAnimal(this);
    } else {
      m_outOfPenPosition = transform.position;
    }
    m_dragging = true;
  }

	private void onDropped(GLDragEventArgs args) {
    Debug.Log ("Dropped "+this+" with state "+CurrentState);
    if (TriedToDropInLockedPen) {
      transform.position = m_outOfPenPosition; // TODO
      TriedToDropInLockedPen = false;
    }
    IdleState idle = m_currentState as IdleState;
    if (idle != null) {
      idle.PauseWandering();
    }
    m_dragging = false;
    CheckForTarget();
	}

  public void BeginIdle()
  {
    m_currentState = new IdleState().Initialize(this);
    CheckForTarget();
  }

  public void OnEnterPen(AnimalPen pen)
  {
    InPen = pen;
    if (pen == null) {
      transform.parent = AnimalManager.Instance.AnimalParent;
      BeginIdle();
    } else {
      GetComponent<GLDragDropItem>().enabled = !pen.Locked;
      if (pen.AnimalGrid != null) {
        m_currentState = new PennedState().Initialize(this);
      }
    }
  }

  public void BeginMovingTowardsFood(Food food) {
    m_currentState = new TowardsFoodState().Initialize(this, food);
  }

  public void BeginMovingTowardsPen(AnimalPen pen) {
    m_currentState = new TowardsPenState().Initialize(this, pen);
  }

  public void StartEating(Food food) {
    m_currentState = new EatingFoodState().Initialize(this, food);
  }

  /*
  public void EnterPen(AnimalPen pen) {
    pen.AddAnimal(this);
  }
  */

  public void SetColor(Color c, bool change = false) {
    if (change) {
      float d = UnityEngine.Random.Range(0.25f, 0.5f);
      float i = UnityEngine.Random.Range(0, 3);
      c.r = Mathf.Clamp01( c.r + ((i == 0)? d : -0.5f * d ));
      c.g = Mathf.Clamp01( c.g + ((i == 1)? d : -0.5f * d ));
      c.b = Mathf.Clamp01( c.b + ((i == 2)? d : -0.5f * d ));
    }
    BodyTexture.color = c;
	  if (AngryTexture != null) AngryTexture.color = c;
    foreach (UITexture lid in Eyelids) {
      lid.color = c;
    }
  }
  /*
  public void HungerForMoreFood()
  {
    if (DesiredFood == FoodType.NONE)
    {
      DesiredFood = (FoodType) UnityEngine.Random.Range(1f, (float)(FoodType.TOTAL_TYPES-1));
    }
  }
  */

  void Update()
  {
    if (m_currentState != null && !m_dragging)
    {
      m_currentState.Do();
    }

    //HungerForMoreFood();
    if (InPen != null) {
      Mood = (InPen.Satisfied)? Moods.HAPPY : Moods.SAD;
    } else {
      Mood = Moods.NEUTRAL;
    }

    if (AngryTexture != null) {
      AngryTexture.gameObject.SetActive( Mood == Moods.SAD );
    }
    foreach (UITexture closedEye in ClosedEyes) {
      closedEye.gameObject.SetActive( Mood == Moods.HAPPY || CurrentState is EatingFoodState );
    }
  }

  void OnCollisionEnter(Collision collision) {
    IdleState idle = m_currentState as IdleState;
    if (idle != null) {
      idle.WanderAwayFrom( collision.collider.transform.position );
    }
  }

  public void CheckForTarget() {
    // Switch to the closest point of interest, or Idle if there's not one.
    if (CurrentState is PennedState) return; // can't be interrupted

    // We'll be doing things a little hackily in order to check for both food and open pens
    // Ideally food and pen would both extend "PointOfInterest" or whatever...
    // and TowardsFoodState and TowardsPenState would be combined
    List<Transform> targets = AnimalManager.Instance.Foods.ConvertAll(x => x.transform);
    targets.AddRange( AnimalManager.Instance.OpenPens.ConvertAll(x => x.transform) );

    float closestDist = float.PositiveInfinity;
    Transform closestTarget = null;
   
    foreach (Transform target in targets) {
      Food food = target.GetComponent<Food>();
      AnimalPen pen = target.GetComponent<AnimalPen>();
      if ((food != null && food.Kind != Kind) || (pen != null && pen.TargetKind != Kind)) continue;

      float dist = Vector3.Distance(transform.position, target.position);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = target;
      }
    }

    //Debug.Log (this+" closest target: "+closestTarget+" Idling? "+(CurrentState is IdleState));

    if (closestTarget != null) {
      Food food = closestTarget.GetComponent<Food>();
      AnimalPen pen = closestTarget.GetComponent<AnimalPen>();
      if (food != null) m_currentState = new TowardsFoodState().Initialize(this, food);
      else if (pen != null) m_currentState = new TowardsPenState().Initialize(this, pen);
    } else {
      // start idling... or continue idling
      if (!(CurrentState is IdleState)) m_currentState = new IdleState().Initialize(this);
    }
  }
}
