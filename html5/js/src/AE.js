/**
 * Created by Jerry Fu on 12/17/2014.
 */

AE = {};

AE.Animation = function(data, game)
{
    this.data = data; // AE.Data
    this.currentFrame = 0;
    this.isPlaying = false;
    this.loop = false;
    this.reversed = false;
    this.totalFrames = data.totalFrames;

    this.init(game);
};

AE.Animation.prototype.init = function(game)
{
    this.gameObject = game.add.sprite();

    var comp = this.data.composition;
    var layers = comp.layers;
    for (var i=0; i < layers.length; i++)
    {
        var layer = layers[i];
        if (layer.type == "Footage")
        {
            layer.sprite = game.make.sprite(0, 0, layer.name);
            layer.goToFrame(0);

            this.gameObject.addChild(layer.sprite);
        }
    }
};

AE.Animation.prototype.play = function()
{
    this.isPlaying = true;
};

AE.Animation.prototype.update = function()
{
    if (this.isPlaying)
    {
        if (!this.reversed)
        {
            this.currentFrame++;
            if (this.currentFrame > this.totalFrames)
            {
                if (this.loop)
                {
                    this.currentFrame = 0;
                }
                else
                {
                    this.currentFrame = this.totalFrames;
                    this.isPlaying = false;
                }
            }
        }
        else
        {
            this.currentFrame--;
            if (this.currentFrame < 0)
            {
                if (this.loop)
                {
                    this.currentFrame = this.totalFrames;
                }
                else
                {
                    this.currentFrame = 0;
                    this.isPlaying = false;
                }
            }
        }

        this.goToFrame(this.currentFrame);
    }
};

AE.Animation.prototype.goToFrame = function(frameNum)
{

};

AE.Data = function(xmlDom)
{
    this.requiredAssets = {}; // Used to track what assets are required for this animation.
    if (xmlDom.children[0].nodeName == "after_affect_animation_doc") xmlDom = xmlDom.children[0];
    if (xmlDom.attributes)
    {
        for (var i=0; i < xmlDom.attributes.length; i++)
        {
            var attribute = xmlDom.attributes[i];
            this[attribute.nodeName] = attribute.value;
        }
    }

    for (var i=0; i < xmlDom.children.length; i++)
    {
        var node = xmlDom.children[i];
        var nodeName = node.nodeName;
        var nodeAttributes;

        if (nodeName == "sub_items")
        {
            this.compByID = {};
            nodeAttributes = [];
            for (var subItemIndex = 0; subItemIndex < node.children.length; subItemIndex++)
            {
                var subItem = node.children[subItemIndex];
                var comp = new AE.Composition(subItem, this);

                nodeAttributes.push(comp);

                this.compByID[comp.id] = comp;
            }
        }
        else if (nodeName == "composition")
        {
            nodeAttributes = new AE.Composition(node, this);
        }
        else if (nodeName == "layer")
        {
            nodeAttributes = new AE.Layer(node, this);
            console.warn("Wasn't expecting a layer here...");
        }
        else if (nodeName == "keyframe")
        {
            nodeAttributes = new AE.Keyframe(node, this);
            console.warn("Wasn't expecting a keyframe here...");
        }
        else if (nodeName == "meta")
        {
            for (var i=0; i < node.attributes.length; i++)
            {
                var attribute = node.attributes[i];
                this[attribute.nodeName] = attribute.value;
            }
            continue;
        }
        else
        {
            console.error("Didn't find a nodename that was understood. Got "+nodeName);
        }

        if (this.hasOwnProperty(nodeName))
        {
            console.error("Already have attribute: " + nodeName);
        }
        this[nodeName] = nodeAttributes;
    }
};

AE.Composition = function(xmlDom, root)
{
    this.root = root;
    // Copy any base attributes
    for (var i=0; i < xmlDom.attributes.length; i++)
    {
        var attribute = xmlDom.attributes[i];
        this[attribute.nodeName] = attribute.value;
    }

    this.layers = [];
    for (var i=0; i < xmlDom.children.length; i++)
    {
        var child = xmlDom.children[i]; // <layer> or <meta>
        if (child.nodeName == "layer")
        {
            this.layers.push(new AE.Layer(child, root));
        }
        else if (child.nodeName == "meta")
        {
            for (var attributeIndex = 0; attributeIndex < child.attributes.length; attributeIndex++)
            {
                var attribute = child.attributes[attributeIndex];
                this[attribute.nodeName] = attribute.value;
            }
        }
        else
        {
            console.error("Didn't know how to process node with name "+ child.nodeName);
        }
        // </layer>
    }
};

AE.Keyframe = function(xmlDom, root)
{
    this.root = root;
    // Copy any base attributes
    for (var i=0; i < xmlDom.attributes.length; i++)
    {
        var attribute = xmlDom.attributes[i];
        this[attribute.nodeName] = attribute.value;
    }

    this.frame = parseInt(this.frame);

    for (var i=0; i < xmlDom.children.length; i++)
    {
        var child = xmlDom.children[i]; // <source>
        for (var j=0; j < child.children.length; j++)
        {
            // Create and populate property object
            var property = {};
            var srcProperty = child.children[j]; // <property>
            for (var childAttributeIndex=0; childAttributeIndex < srcProperty.attributes.length; childAttributeIndex++)
            {
                var srcAttribute = srcProperty.attributes[childAttributeIndex];
                if (srcAttribute.nodeName == "name") continue; // skip name attribute, already used to store property of keyframe

                property[srcAttribute.nodeName] = srcAttribute.value;
            } // </property>

            // Store as property
            var name = srcProperty.attributes["name"].value; // store using property name
            if (this.hasOwnProperty(name))
            {
                console.error("Property "+name+" already exists!");
            }

            this[name] = property;
        } // </source>
    }
};

/**
 * LAYER
 */
AE.Layer = function(xmlDom, root)
{
    this.root = root;
    this.sprite = null; // the sprite that will be created to represent this layer, if any.
    // Copy any base attributes
    for (var i=0; i < xmlDom.attributes.length; i++)
    {
        var attribute = xmlDom.attributes[i];
        this[attribute.nodeName] = attribute.value;
    }

    if (this.type == "Composition")
    {
        this.compositionReference = null;
    }
    else if (this.type == "Footage")
    {
        root.requiredAssets[this.name] = true;
    }
    else
    {
        console.error("Unknown layer type: "+ this.type);
    }

    this.keyframes = [];
    for (var i=0; i < xmlDom.children.length; i++)
    {
        var child = xmlDom.children[i]; // <keyframe>
        this.keyframes.push(new AE.Keyframe(child, root));

        // </keyframe>
    }
}

AE.Layer.prototype.goToFrame = function(frameNum)
{
    // Find Frame
    var keyframe = this.getFrameData(frameNum); // AE.Keyframe

    // Apply Frame
    var sprite = this.sprite;
    if (keyframe.hasOwnProperty("Position"))
    {
        sprite.x = keyframe.Position.x;
        sprite.y = -keyframe.Position.y;
    }

    if (keyframe.hasOwnProperty("Rotation"))
    {
        sprite.rotation = keyframe.Rotation.val;
        if (sprite.rotation != 0)
        {
            console.log(sprite.rotation);
        }
    }

    if (keyframe.hasOwnProperty("Scale"))
    {
        sprite.scale.set(keyframe.Scale.x / 200.0, keyframe.Scale.y / 200.0);
    }

    if (keyframe.hasOwnProperty("Anchor Point"))
    {
        sprite.pivot.set(keyframe["Anchor Point"].x, keyframe["Anchor Point"].y);
    }
};

AE.Layer.prototype.getFrameData = function(frameNum)
{
    for (var i=this.keyframes.length-1; i >= 0; i--)
    {
        var keyframe = this.keyframes[i];
        if (keyframe.frame <= frameNum) return keyframe;
    }

    return null;
};