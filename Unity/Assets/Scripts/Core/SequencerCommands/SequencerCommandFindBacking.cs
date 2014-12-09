using UnityEngine;
using System.Collections;
using PixelCrushers.DialogueSystem;
using PixelCrushers.DialogueSystem.SequencerCommands;

public class SequencerCommandFindBacking : SequencerCommandFindEquipment {

  protected override EquipableModel GetEquipment() {
    int id = 2000+GetParameterAsInt(0);
    return BackingModel.GetModel(id);
    // TODO: This is called GetEquipment but it always gets backing?
  }
	
}