using UnityEngine;
using System;
using System.Collections.Generic;
using PixelCrushers.DialogueSystem;

public static class GlobalData {
  public static Dictionary<string, System.Object> ms_globals = new Dictionary<string, System.Object>();

  public class ValueTypeException : System.Exception
  {
    public ValueTypeException() : base() { }
    public ValueTypeException(string message) : base(message) { }
    public ValueTypeException(string message, System.Exception inner) : base(message, inner) { }
    
    // A constructor is needed for serialization when an 
    // exception propagates from a remoting server to the client.  
    protected ValueTypeException(System.Runtime.Serialization.SerializationInfo info,
                                         System.Runtime.Serialization.StreamingContext context) { }
  }

  /// <summary>
  /// Set a global variable of a specific type
  /// </summary>
  /// <param name="key">String identifier for the variable</param>
  /// <param name="value">Value to store</param>
  /// <typeparam name="T">The type of value to store.  Will throw a ValueTypeException of the stored value is a different type.</typeparam>
  // Can throw ValueTypeException!
  public static void SetValue<T>(string key, T value)
  {
    try {
      GetValue<T>(key);
    } catch (KeyNotFoundException) {
      // If no key is found, this is new assignment; all ok!
    }
    ms_globals[key] = value;
    DialogueLua.SetVariable(key, value);
    PlayMakerFSM.BroadcastEvent (key + "_SET");
  }

  /// <summary>
  /// Gets the value of a global variable of a specific type
  /// </summary>
  /// <returns>The value requested</returns>
  /// <param name="key">String identifier for the variable.  Will throw KeyNotFoundException if no value with this key is in storage</param>
  /// <typeparam name="T">The type of value to retrieve.  Will throw a ValueTypeException of the stored type is different than the one requested.</typeparam>
  public static T GetValue<T>(string key)
  {
    System.Object v = ms_globals[key];
    // This check could be made debug-only if we're feeling confident about our game quality.
    if (v != null) {
      if (!v.GetType().Equals(typeof(T))) {
        throw new ValueTypeException(string.Format("Attempt to use key {0} with a value of type {1}, when it really contains a value of type {2}", key, typeof(T), v.GetType()));
      }
    }

    return (T)v;
  }

  /// <summary>
  /// Returns whether a value of the particular name and type exists.
  /// </summary>
  /// <returns>The value requested</returns>
  /// <param name="key">String identifier for the variable.  Will throw KeyNotFoundException if no value with this key is in storage</param>
  /// <typeparam name="T">The type of value to retrieve.  Will throw a ValueTypeException of the stored type is different than the one requested.</typeparam>
  public static bool ValueExists<T>(string key)
  {
    try {
      GetValue<T>(key);
    } catch (KeyNotFoundException) {
      return false;
    } catch (ValueTypeException) {
      return false;
    }

    return true;
  }

  /// <summary>
  /// Delete the value of the specified key.
  /// </summary>
  /// <param name="key">String identifier for the variable</param>
  /// <typeparam name="T">The type of value stored.  Will throw a ValueTypeException of the stored type is different than the one requested.</typeparam>
  public static void Delete<T>(string key)
  {
    try {
      GetValue<T>(key);
      ms_globals.Remove(key);
    } catch (KeyNotFoundException) {
      // If the key is not found, the element doesn't exist already anyway.
    }
  }
}
