using UnityEngine;
public class EquippedArgubotConditional : Conditional
{
  public EquippedArgubotConditional()
  {
    SignalManager.BotEquipmentChanged += onBotEquipmentChanged;
    SignalManager.QuestStarted += onQuestStarted;
  }

  public void onBotEquipmentChanged(BotModel b)
  {
    IsSatisfied = true;
  }

  public void onQuestStarted(Quest q)
  {
    IsSatisfied = false;
  }

  ~EquippedArgubotConditional()
  {
    SignalManager.BotEquipmentChanged += onBotEquipmentChanged;
    SignalManager.QuestStarted += onQuestStarted;
  }
}