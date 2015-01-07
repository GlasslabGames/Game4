/**
 * Created by Jerry Fu on 12/12/2014.
 */

CC = {};

CC.Game = {};

window.onload = function() {
  var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update});

  function preload() {
    game.load.image('disk', 'assets/images/copy-that-floppy.png');
    game.load.image('1UP', 'assets/images/mushroom2.png');

  }

  var parent;
  var child;
  var child2;
  var dragObject;
  var dragOrigin;
  function conseClick()
  {
    console.log("TEST");
  };

  function create()
  {

    game.load.start();

    parent = game.add.sprite(100, 100, 'disk');
    parent.inputEnabled = true;
    parent.anchor.x = parent.anchor.y = .5;
    parent.name = 'disk';
    parent.events.onInputUp.add(onUp, this);
    parent.events.onInputDown.add(onDown, this);

    child = game.make.sprite(0, 0, '1UP');
    child.name = "1UP";
    child.anchor.x = child.anchor.y = .5;
    child.x = 200;
    child.y = 50;
    child.inputEnabled = true;
    child.input.priorityID = 1;
    child.events.onInputUp.add(onUp, this);
    child.events.onInputDown.add(onDown, this);
    parent.addChild(child);

    child2 = game.make.sprite(0, 0, '1UP');
    child2.name = "1UP";
    child2.anchor.x = child2.anchor.y = .5;
    child2.x = 50;
    child2.y = 250;
    child2.inputEnabled = true;
    child2.input.priorityID = 2;
    child2.events.onInputUp.add(onUp, this);
    child2.events.onInputDown.add(onDown, this);
    child.addChild(child2);

    game.add.text(250, 250, "Awesome", { fill:"#fff" }).name = "Text";
  }

  function update()
  {
    if (dragObject)
    {
      var localPoint = dragObject.toLocal(new PIXI.Point(game.input.worldX, game.input.worldY));
      dragObject.x += localPoint.x;
      dragObject.y += localPoint.y;
    }
  }

  function onDown(sprite, pointer)
  {
    dragObject = sprite;
    dragOrigin = new PIXI.Point(pointer.screenX, pointer.screenY);
  }

  function onUp(sprite, pointer)
  {
    dragObject = null;
    dragOrigin.subtract(pointer.screenX, pointer.screenY);
    if (dragOrigin.getMagnitudeSq() <= 1)
    {
      var o = sprite;
      if (o.scale.x == 2)
        o.scale.x = 1;
      else
        o.scale.x = 2;
    }
  }
};