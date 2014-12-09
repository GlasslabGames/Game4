using UnityEngine;
using System.Collections;

public class GlobalObjectMaker : SingletonBehavior<GlobalObjectMaker> {
  void Start () {
    DontDestroyOnLoad(gameObject);
    this.enabled = false;
	}

}
