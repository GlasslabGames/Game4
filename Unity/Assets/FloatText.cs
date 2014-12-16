using UnityEngine;
using System.Collections;

public class FloatText : MonoBehaviour {
	public UILabel Text;

  public void Start() {
    Text.alpha = 0;
  }

	public void Show(string text, Vector3 pos) {
		Text.text = text;
		transform.position = pos;

    Text.alpha = 0;
		Text.transform.localPosition = Vector3.zero;
    TweenPosition tp = TweenPosition.Begin(Text.gameObject, 1.5f, new Vector3(0, 100, 0));
    tp.method = UITweener.Method.EaseInOut;
    EventDelegate.Add( tp.onFinished, delegate {
      Text.alpha = 0;
    }, true);
		TweenAlpha.Begin(Text.gameObject, 1f, 1);
	}
}
