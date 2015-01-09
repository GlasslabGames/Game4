/**
 * Created by Jerry Fu on 12/17/2014.
 */

AE = {};

AE.Animation = function(data, game)
{
    this.data = data; // AE.Data
    this.currentFrame = 0;
    this.elapsedTime = 0.0; // time elapsed in animation in milliseconds
    this.isPlaying = false;
    this.loop = false;
    this.reversed = false;
    this.totalFrames = parseInt(data.totalFrames);
    this.duration = parseFloat(data.duration) * 1000.0; // duration of animation in milliseconds

    this.init(game);
};

AE.Animation.prototype.init = function(game)
{
    this.sprite = game.add.sprite();
    this.renderGroup = game.make.group();
    this.sprite.addChild(this.renderGroup);
    this.sprite.update = this.update;

    var comp = this.data.composition;
    comp.init(game, this.renderGroup);
    this.sprite.addChild(comp.skeletalContainer);
    this.renderGroup.sort('z', Phaser.Group.SORT_DESCENDING);

    this.goToFrame(0);
};

AE.Animation.prototype.play = function()
{
    this.isPlaying = true;
};

AE.Animation.prototype.update = function(dt)
{
    if (this.isPlaying)
    {
        // Calculate current time
        if (!this.reversed)
        {
            this.elapsedTime += dt;
            if (this.elapsedTime > this.duration)
            {
                if (this.loop)
                {
                    this.elapsedTime -= this.duration;
                }
                else
                {
                    this.elapsedTime = this.duration;
                    this.isPlaying = false;
                }
            }
        }
        else
        {
            this.elapsedTime -= dt;
            if (this.currentFrame < 0)
            {
                if (this.loop)
                {
                    this.elapsedTime -= this.duration;
                }
                else
                {
                    this.elapsedTime = 0;
                    this.isPlaying = false;
                }
            }
        }

        var normalizedTime = this.elapsedTime / this.duration;
        this.currentFrame = parseInt(this.totalFrames * normalizedTime);

        this.goToFrame(this.currentFrame);
    }
};

AE.Animation.prototype.goToFrame = function(frameNum)
{
    this.data.composition.goToFrame(frameNum);
};

AE.Data = function(xmlDom)
{
    this.requiredAssets = {}; // Used to track what assets are required for this animation.
    this.compByID = {}; // Used to track compositions by their ID
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
            var layer = new AE.Layer(child, root);
            this.layers.push(layer);
            layer.composition = this;
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

AE.Composition.prototype.init = function(game, renderGroup)
{
    var layers = this.layers;
    if (!this.skeletalContainer)
        this.skeletalContainer = game.make.sprite();

    for (var i=0; i < layers.length; i++)
    {
        var layer = layers[i];
        if (!layer.sprite)
        {
            layer.sprite = game.make.sprite(0, 0, layer.name);
            layer.sprite.z = i;
            renderGroup.add(layer.sprite);
            //layer.skeletalContainer = game.make.sprite(0,0,layer.name);
            layer.skeletalContainer = game.make.sprite();
        }

        if (layer.type == "Footage")
        {
            //layer.goToFrame(0);

            if (layer.parent == "none")
            {
                this.skeletalContainer.addChild(layer.skeletalContainer);
            }
            else
            {
                var parentLayer = layer.composition.layers[parseInt(layer.parent) - 1];
                // TODO: Clean since this check shouldn't need to exist
                if (!parentLayer.sprite)
                {
                    parentLayer.sprite = game.make.sprite(0, 0, parentLayer.name);
                    parentLayer.sprite.z = parentLayer.id - 1;
                    //parentLayer.skeletalContainer = game.make.sprite(0, 0, parentLayer.name);
                    parentLayer.skeletalContainer = game.make.sprite();
                    renderGroup.add(parentLayer.sprite);
                }

                parentLayer.skeletalContainer.addChild(layer.skeletalContainer);
            }
        }
        else if (layer.type == "Composition")
        {
            // TODO: This doesn't compensate for already-initialized compositions.
            // TODO: This assumes layer of composition type use a unique composition reference
            var comp = this.root.compByID[layer.id];
            var compGroup = game.make.group();
            renderGroup.add(compGroup);
            comp.init(game, compGroup);
            this.skeletalContainer.addChild(comp.skeletalContainer);
            compGroup.sort('z', Phaser.Group.SORT_DESCENDING);
        }
    }
};

AE.Composition.prototype.goToFrame = function(frameNum)
{
    for (var i=0; i < this.layers.length; i++)
    {
        var layer = this.layers[i];
        layer.goToFrame(frameNum);
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
    this.composition = null; // the composition that this layer is under
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
    if (!this.sprite)
    {
        return;
    }

    function getGlobalRotation(sprite)
    {
        var totalRotation = sprite.rotation;
        var parent = sprite.parent;
        while (parent)
        {
            totalRotation += parent.rotation;
            parent = parent.parent;
        }

        return totalRotation;
    }
    // Find Frame
    var keyframe = this.getFrameData(frameNum); // AE.Keyframe

    // Apply Frame
    if (keyframe.hasOwnProperty("Position"))
    {
        this.skeletalContainer.x = parseFloat(keyframe.Position.x);
        this.skeletalContainer.y = parseFloat(keyframe.Position.y);
    }

    if (keyframe.hasOwnProperty("Rotation"))
    {
        this.skeletalContainer.rotation = keyframe.Rotation.val / 180 * Math.PI;
    }

    if (keyframe.hasOwnProperty("Scale"))
    {
        this.skeletalContainer.scale.set(keyframe.Scale.x / 100.0, keyframe.Scale.y / 100.0);
    }

    if (keyframe.hasOwnProperty("Anchor Point"))
    {
        this.skeletalContainer.pivot.set(keyframe["Anchor Point"].x, keyframe["Anchor Point"].y);
        //this.sprite.pivot.set(this.skeletalContainer.pivot.x, this.skeletalContainer.pivot.y);
    }

    if (keyframe.hasOwnProperty("Opacity"))
    {
        this.skeletalContainer.alpha = keyframe.Opacity.val / 100.0;
    }

    if (this.skeletalContainer.parent)
    {
        var globalSkeletalPosition = this.skeletalContainer.world;
        console.log(this.sprite.key + " - (" + globalSkeletalPosition.x + ", " + globalSkeletalPosition.y + ")");
        if (this.sprite.parent)
        {
            var localDeltaVector = this.sprite.toLocal(globalSkeletalPosition);
            this.sprite.position.x += localDeltaVector.x;
            this.sprite.position.y += localDeltaVector.y;
        }
        else
        {
            this.sprite.position = globalSkeletalPosition;
        }
    }
    else
    {
        this.sprite.position = this.skeletalContainer.position;
    }

    this.sprite.rotation = getGlobalRotation(this.skeletalContainer);
    //this.sprite.scale.set(this.skeletalContainer.scale.x, this.skeletalContainer.scale.y);

    this.sprite.alpha = this.skeletalContainer.worldAlpha;

    if (this.type == "Composition")
    {
        // TODO: This doesn't compensate for already-initialized compositions.
        // TODO: This assumes layer of composition type use a unique composition reference
        var comp = this.root.compByID[this.id];
        for (var i=comp.layers.length-1; i >= 0; i--)
        {
            comp.layers[i].goToFrame(frameNum);
        }
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