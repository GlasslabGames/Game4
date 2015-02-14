/**
 * Created by Rose Abernathy on 1/6/2015.
 *
 * Dependencies: Phaser.Signal
 */

var GlassLab = GlassLab || {};

/**
 * ENTITY
 */
GlassLab.Entity = function(name) {
  this.name = name;
  this.components = {};
};

GlassLab.Entity.prototype.addComponent = function(component) {
  this.components[component.name] = component;
  component.setTarget(this);
  return component;
};

GlassLab.Entity.prototype.removeComponent = function(component) {
  if (component.name && this.components[component.name]) {
    delete this.components[component.name];
    component.setTarget(null);
  } else {
    console.warn("Tried to remove a component which wasn't attached.");
  }
  return component;
};

GlassLab.Entity.prototype.removeComponentByName = function(componentName) {
  if (this.components[componentName]) {
    this.removeComponent(this.components[componentName]);
  } else {
    console.warn("Tried to remove a component which wasn't attached.");
  }
};

// TODO: Deal with destroying objects

/**
 * COMPONENT
 */
GlassLab.Component = function(ownerEntity) {
  this.name = null; // should be set for each subclass
  this.entity = ownerEntity; // the entity this is attached to
};