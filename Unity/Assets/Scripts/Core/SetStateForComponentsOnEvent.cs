using UnityEngine;
using System.Collections;
using System.Collections.Generic;


public class SetStateForComponentsOnEvent : MonoBehaviour {

  // List of components to change
  public List<MonoBehaviour> m_components;
  private bool m_lastState = true;


  // Return parameter indicates if the state has changed since last
	public bool Enable() {
    if( m_lastState == true )  return false;

    for( int i = 0; i < m_components.Count; i++ ) {
      m_components[ i ].enabled = true;
    }
    m_lastState = true;
    return true;
  }

  // Return parameter indicates if the state has changed since last
  public bool Disable() {
    if( m_lastState == false )  return false;

    for( int i = 0; i < m_components.Count; i++ ) {
      m_components[ i ].enabled = false;
    }
    m_lastState = false;
    return true;
  }
}