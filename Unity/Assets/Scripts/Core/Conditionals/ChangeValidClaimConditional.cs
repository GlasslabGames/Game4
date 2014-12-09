
using System.Collections.Generic;

public class ChangeValidClaimConditional : Conditional
{
  private ClaimModel[] m_prevClaimModels;
  private DataModel[] m_prevDatamodels;

  public ChangeValidClaimConditional()
  {
    SignalManager.CoreEquipFuse += onBotCoreFused;
    SignalManager.QuestStarted += onQuestStarted;


    m_prevClaimModels = new ClaimModel[3];
    m_prevDatamodels = new DataModel[3];
  }

  // Reset on quest start since we want the pivot to happen during a single topic
  private void onQuestStarted(Quest q)
  {
    for (int i=0; i<3; i++)
    {
      m_prevClaimModels[i] = null;
      m_prevDatamodels[i] = null;
    }
  }

  private void onBotCoreFused(bool fused)
  {
    if (fused)
    {
      List<BotModel> bots = EquipmentManager.Instance.Bots;
      for (int i=bots.Count-1; i>=0; i--)
      {
        BotModel bot = bots[i];
        ClaimModel prevClaim = m_prevClaimModels[i];
        DataModel prevData = m_prevDatamodels[i];
        if (bot != null && bot.Core != null)
        {
          ClaimModel botClaim = bot.Core.Claim;
          DataModel botData = bot.Core.Data;
          if (botClaim != null && botData != null &&
              (prevClaim == null || prevData == null))
          {
            m_prevClaimModels[i] = botClaim;
            m_prevDatamodels[i] = botData;
          }
        }
      }

      Refresh();
    }
  }

  override protected bool CalculateIsSatisfied()
   {
    List<BotModel> bots = EquipmentManager.Instance.Bots;
    for (int i=bots.Count-1; i>=0; i--)
    {
      BotModel bot = bots[i];
      ClaimModel prevClaim = m_prevClaimModels[i];
      DataModel prevData = m_prevDatamodels[i];
      if (prevClaim != null && prevData != null && bot != null && bot.Core != null)
      {
        ClaimModel botClaim = bot.Core.Claim;
        DataModel botData = bot.Core.Data;
        if (botClaim != null && botClaim != prevClaim &&
            botData != null && botData != prevData)
        {
          return true;
        }
      }
    }

    return false;
  }

  ~ChangeValidClaimConditional()
  {
    SignalManager.CoreEquipFuse -= onBotCoreFused;
    SignalManager.QuestStarted -= onQuestStarted;
  }
}