/**
 * Created by Rose Abernathy on 1/6/2015.
 */

/**
 * ENTITY
 */
function Entity(name) {
  this.name = name;
  this.components = {};
}

Entity.prototype.addComponent = function(component) {
  this.components[component.name] = component;
  component.setTarget(this);
  return component;
}

Entity.prototype.removeComponent = function(component) {
  if (component.name && this.components[component.name]) {
    delete this.components[component.name];
    component.setTarget(null);
  } else {
    console.log("WARNNING: Tried to remove a component which wasn't attached.");
  }
  return component;
}

Entity.prototype.removeComponentByName = function(componentName) {
  if (this.components[componentName]) {
    this.removeComponent(this.components[componentName]);
  } else {
    console.log("WARNNING: Tried to remove a component which wasn't attached.");
  }
}

Entity.prototype.update = function() {
  for (var name in components) {
    if (components.hasOwnProperty(name)) {
      components[name].update();
    }
  }
}

// TODO: Deal with destroying objects

/**
 * COMPONENT
 */
function Component() {
  this.name = null; // should be set for each subclass
  this.entity = null; // the entity this is attached to
}

Component.prototype.update = function() {}

Component.prototype.setEntity = function(e) {
  this.entity = e;
  // Remember to deal with the case where e == null for when we want to unattach it
}