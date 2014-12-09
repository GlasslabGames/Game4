using UnityEngine;

public class EnterRoomObjective : Objective {
  public string RoomName;
  private GameObject m_target;

  protected override void OnEnable()
  {
    base.OnEnable();

    SignalManager.RoomChanged += OnEnterRoom;

    if (ExplorationManager.Instance != null && ExplorationManager.Instance.CurrentRoom != null)
    {
      OnEnterRoom(ExplorationManager.Instance.CurrentRoom.name);
    }
  }

  public void OnEnterRoom(string enterRoom)
  {
    if (enterRoom == RoomName)
    {
      m_isComplete = true;
      onComplete();
      gameObject.SetActive(false);
    }
  }

  protected override void OnDisable()
  {
    base.OnDisable();
    SignalManager.RoomChanged -= OnEnterRoom;
  }
}
