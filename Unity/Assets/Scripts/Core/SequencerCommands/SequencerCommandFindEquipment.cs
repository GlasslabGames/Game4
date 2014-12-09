using UnityEngine;
using System.Collections;
using PixelCrushers.DialogueSystem;
using PixelCrushers.DialogueSystem.SequencerCommands;

public class SequencerCommandFindEquipment : SequencerCommand {

	public void Start() {
		// Add your initialization code here. You can use the GetParameter***() and GetSubject()
		// functions to get information from the command's parameters. You can also use the
		// Sequencer property to access the SequencerCamera, CameraAngle, and other properties
		// on the sequencer.

		Equip ( GetEquipment() );
    Stop ();
	}

  protected virtual EquipableModel GetEquipment() {
    int id = GetParameterAsInt(0);
    return EquipableModel.GetModel(id);
  }

	protected void Equip(EquipableModel equipment) {
		if (equipment == null) {
			Debug.LogError("Invalid equipment in FindEquipment Sequence!", this);
		} else {
			DialogueManager.ShowAlert( "You recieved <"+equipment.Label+">! Open the Argubot screen to equip it." );
			EquipmentManager.InstanceOrCreate.Add(equipment);
		}
	}
	
	public void Update() {
		// Add your update code here. When the command is done, call Stop().
	}
	
	public void OnDestroy() {
		// Add your finalization code here. This is critical. If the sequence is cancelled and this
		// command is marked as "required", then only Start() and OnDestroy() will be called.
	}
	
}