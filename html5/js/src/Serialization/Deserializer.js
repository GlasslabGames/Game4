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

    // If we don't have the type cached, look it up
    var typeComponents = typeName.split(".");
    classType = window[typeComponents[0]];
    for (var i=1, j=typeComponents.length; i < j; i++)
    {
        classType = classType[typeComponents[i]];
    }

    // Store into cache and return
    return GlassLab.Deserializer._typeNameCache[typeName] = classType;
};