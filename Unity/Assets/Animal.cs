﻿using UnityEngine;
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

  private Idle m_currentState; // hacky but we're only using Idle now anyway

  public Vector2 TargetPoint;
  private float m_idleTime;

  private GLDragDropContainer m_container;

  public UITexture BodyTexture;
  public UITexture AngryTexture;

  public AnimalPen InPen;


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
    if (args.DragObject.GetComponent<FoodCrate>() != null) {
      AnimalManager.Instance.Split(this, 3);
      GameObject.Destroy(args.DragObject.gameObject);
    }
  }

  // onItemTaken doesn't work well so we're doing this here ¯\_(ツ)_/¯
  private void onDragged(GLDragEventArgs args) {
    if (InPen != null) {
      InPen.RemoveAnimal(this);
    }
  }

	private void onDropped(GLDragEventArgs args) {
		m_currentState.PauseWandering();
	}

  public void BeginIdle()
  {
    Target = null;
    m_currentState = new Idle().Initialize(this) as Idle;
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

  public void HungerForMoreFood()
  {
    if (DesiredFood == FoodType.NONE)
    {
      DesiredFood = (FoodType) UnityEngine.Random.Range(1f, (float)(FoodType.TOTAL_TYPES-1));
    }
  }

  void Update()
  {
    if (m_currentState != null)
    {
      m_currentState.Do();
    }

    HungerForMoreFood();

    if (AngryTexture != null) {
      AngryTexture.gameObject.SetActive( InPen != null && !InPen.Satisfied );
    }
  }

  void OnCollisionEnter(Collision collision) {
    Idle idle = m_currentState as Idle;
    if (idle != null) {
      idle.WanderAwayFrom( collision.collider.transform.position );
    }
  }
}
