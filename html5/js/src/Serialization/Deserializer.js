/**
 * Created by Jerry Fu on 2/11/2015.
 */

var GlassLab = GlassLab || {};

GlassLab.Deserializer = {};

GlassLab.Deserializer._typeNameCache = {};

/**
 * STATIC
 * @param blob Stringified version of class
 * @returns {objClass} An instance of the class with properties specified in the blob
 */
GlassLab.Deserializer.deserializeObj = function(blob)
{
    var objClass = GlassLab.Deserializer.getClassFromTypeName("GlassLab."+blob.__type); // prepend GlassLab since we almost definitely want it
    if (!objClass) objClass = GlassLab.Deserializer.getClassFromTypeName(blob.__type); // else try without GlassLab
    var obj = new objClass();
    for (var property in blob)
    {
        if (blob.hasOwnProperty(property) && property != "__type")
        {
            obj[property] = blob[property];
        }
    }

    return obj;
};

/**
 * STATIC
 * @param typeName Name of the class
 * @returns {objClass} An instance of the class with properties specified in the blob
 */
GlassLab.Deserializer.getClassFromTypeName = function(typeName)
{
    // First check if we searched for this before
    var classType = GlassLab.Deserializer._typeNameCache[typeName];
    if (classType)
    {
        return classType;
    }

    // Store into cache and return
    return GlassLab.Deserializer._typeNameCache[typeName] = GlassLab.Deserializer.getPropertyFromName(typeName);
};

GlassLab.Deserializer.getPropertyFromName = function(propertyName)
{
    var nameComponents = propertyName.split(/[\[\]\.]/); // split on . and [ and ]
    var property = window[nameComponents[0]];
    for (var i=1, j=nameComponents.length; i < j; i++)
    {
        if (nameComponents[i] === "") continue; // empty strings get added e.g. in prop[0].prop
        property = property[nameComponents[i]];
        if (typeof property == 'undefined') return null; // failure
    }

    return property;
};