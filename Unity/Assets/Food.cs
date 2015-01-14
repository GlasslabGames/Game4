using UnityEngine;
using System.Collections;

public class Food : MonoBehaviour {
	public Animal.Kinds Kind;
	private float Health = 1;
  private UITexture m_texture;
  private float m_startSize;

  void Awake() {
    m_texture = GetComponent<UITexture>();
    m_startSize = m_texture.width;
  }

  public void Bite() {
    Health -= 0.002f;
    int size = (int) Mathf.Lerp(5, m_startSize, Health);
    m_texture.width = size;
    //m_texture.height = size;
    if (Health <= 0) {
      AnimalManager.Instance.FoodEaten(this);
      Destroy(this.gameObject);
    }
  }
}
