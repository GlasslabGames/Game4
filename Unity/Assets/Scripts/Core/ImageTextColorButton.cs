using UnityEngine;

/* Based on NGUI ImageButton. Shows a different sprite and changes the text color
 * depending on the state of the button (up, pressed, or disabled.)
 * I didn't include a hover state because we're making a touch game.
 * It looks for children with certain names and assigns those color 1 or 2.
 */
public class ImageTextColorButton : MonoBehaviour
{
	public UISprite m_sprite;
	public string m_spriteName; // the base sprite name
  // The following strings are added to the base sprite name
  public string m_default = "";
  public string m_pressed = "_down";
  public string m_disabled = "_disabled";
  public string m_disabledPressed;

  public Color m_defaultTextColor1;
  public Color m_defaultTextColor2;
  public Color m_pressedTextColor1;
  public Color m_pressedTextColor2;
  public Color m_disabledTextColor1;
  public Color m_disabledTextColor2;

  private UILabel m_label;
  private UILabel m_nameLabel;
  private UILabel m_descriptionLabel;
  private UILabel m_typeLabel;

  // Copied from NGUI ImageButton
	public bool isEnabled
	{
		get
		{
			Collider col = collider;
			return col && col.enabled;
		}
		set
		{
			Collider col = collider;
			if (!col) return;

			if (col.enabled != value)
			{
				col.enabled = value;
				UpdateImage();
			}
		}
	}

  void Awake() {
    Transform child;

    // Look for children with certain names. Based on the AttackButton from Hiro.
    // Description is the 2nd color, every other label gets the 1st color

    // TODO: Move this onto the child GameObject and have it react to parent?
    child = transform.FindChild("Label");
    if (child) m_label = child.GetComponent<UILabel>();

    child = transform.FindChild("Name");
    if (child) m_nameLabel = child.GetComponent<UILabel>();

    child = transform.FindChild("Description");
    if (child) m_descriptionLabel = child.GetComponent<UILabel>();

    child = transform.FindChild("Type");
    if (child) m_typeLabel = child.GetComponent<UILabel>();
  }

	void OnEnable ()
	{
		UpdateImage();
	}
	
	void UpdateImage()
	{
		if (isEnabled)
		{
      if (m_sprite) { m_sprite.spriteName = m_spriteName + m_default; }
      if (m_label) { m_label.color = m_defaultTextColor1; }
      if (m_nameLabel) { m_nameLabel.color = m_defaultTextColor1; }
      if (m_descriptionLabel) { m_descriptionLabel.color = m_defaultTextColor2; }
      if (m_typeLabel) { m_typeLabel.color = m_defaultTextColor1; }
		}
		else
		{
      if (m_sprite) { m_sprite.spriteName = m_spriteName + m_disabled; }
      if (m_label) { m_label.color = m_disabledTextColor1; }
      if (m_nameLabel) { m_nameLabel.color = m_disabledTextColor1; }
      if (m_descriptionLabel) { m_descriptionLabel.color = m_disabledTextColor2; }
      if (m_typeLabel) { m_typeLabel.color = m_disabledTextColor1; }
		}
    if (m_sprite) { m_sprite.MakePixelPerfect(); }
	}

	void OnPress (bool pressed)
	{
		if (pressed)
		{
      if (m_sprite)
      {
        if (isEnabled)
        {
          m_sprite.spriteName = m_spriteName + m_pressed;
        }
        else
        {
          if (m_disabledPressed != null && m_disabledPressed != "")
          {
            m_sprite.spriteName = m_spriteName + m_disabledPressed;
          }
          else
          {
            m_sprite.spriteName = m_spriteName + m_disabled;
          }
        }
      }

      if (m_label) { m_label.color = m_pressedTextColor1; }
      if (m_nameLabel) { m_nameLabel.color = m_pressedTextColor1; }
      if (m_descriptionLabel) { m_descriptionLabel.color = m_pressedTextColor2; }
      if (m_typeLabel) { m_typeLabel.color = m_pressedTextColor1; }
      
      if (m_sprite) { m_sprite.MakePixelPerfect(); }
		}
		else UpdateImage();
	}
}
