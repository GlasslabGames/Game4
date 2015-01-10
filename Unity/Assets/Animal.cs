using UnityEngine;
using System.Collections;
using System;

public class Animal : MonoBehaviour {
  public enum Kinds { RED, BLUE, KINDS_FINAL };
  public Kinds Kind;
  public float Speed;

  public float TurnSpeed; // Degrees per sec

  public GameObject Target;

  public FoodType DesiredFood;

  public bool Happy;

  private AnimalBehaviorState m_currentState; // hacky but we're only using Idle now anyway
  public AnimalBehaviorState CurrentState { get { return m_currentState; } }

  private float m_idleTime;

  private GLDragDropContainer m_container;

  public UITexture BodyTexture;
  public UITexture AngryTexture;

  public AnimalPen InPen;
  public bool TriedToDropInLockedPen;
  private Vector3 m_outOfPenPosition;


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
  }

	private void onDropped(GLDragEventArgs args) {
    if (TriedToDropInLockedPen) {
      transform.position = m_outOfPenPosition; // TODO
      TriedToDropInLockedPen = false;
    }
    IdleState idle = m_currentState as IdleState;
    if (idle != null) {
      idle.PauseWandering();
    }
	}

  public void BeginIdle()
  {
    Debug.Log (this+" begin idle");
    Target = null;
    m_currentState = new IdleState().Initialize(this);
  }

  public void OnEnterPen(AnimalPen pen)
  {
    InPen = pen;
    if (pen == null) {
      m_currentState = new IdleState().Initialize(this);
      transform.parent = AnimalManager.Instance.AnimalParent;
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

  public void EnterPen(AnimalPen pen) {
    // TODO
  }

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
    if (m_currentState != null)
    {
      m_currentState.Do();
    }

    //HungerForMoreFood();

    if (AngryTexture != null) {
      AngryTexture.gameObject.SetActive( InPen != null && !InPen.Satisfied );
    }
  }

  void OnCollisionEnter(Collision collision) {
    IdleState idle = m_currentState as IdleState;
    if (idle != null) {
      idle.WanderAwayFrom( collision.collider.transform.position );
    }
  }
}
