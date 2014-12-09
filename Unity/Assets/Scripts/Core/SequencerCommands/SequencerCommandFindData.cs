using UnityEngine;
using System.Collections;
using PixelCrushers.DialogueSystem;
using PixelCrushers.DialogueSystem.SequencerCommands;

public class SequencerCommandFindData : SequencerCommandFindEquipment {

  protected override EquipableModel GetEquipment() {
    int id = 4000+GetParameterAsInt(0);
    Debug.Log ("Getting data with id "+id);
    return DataModel.GetData(id);
  }
	
}