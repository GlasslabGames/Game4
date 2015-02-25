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
    var objClass = GlassLab.Deserializer.getClassFromTypeName(blob.__type);
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
    var nameComponents = propertyName.split(".");
    var property = window[nameComponents[0]];
    for (var i=1, j=nameComponents.length; i < j; i++)
    {
        property = property[nameComponents[i]];
    }

    return property;
};