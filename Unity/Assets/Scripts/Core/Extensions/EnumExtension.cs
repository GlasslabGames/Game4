using System;
using System.ComponentModel;
using System.Reflection;

public static class EnumExtension
{
  public static string GetDescription(this Enum value)
  {
    FieldInfo fieldInfo = value.GetType().GetField(value.ToString());
    DescriptionAttribute attribute = Attribute.GetCustomAttribute(fieldInfo, typeof(DescriptionAttribute)) as DescriptionAttribute;
    return attribute == null ? value.ToString() : attribute.Description;
  }

  public static string Name(this Enum value)
  {
    // Tries to get the best name for the enum.  Checks description first, falls back to ToString.
    string ret = value.GetDescription ();
    if (ret == null) {
      ret = value.ToString ();
    }

    return ret;
  }
}

