/**
 * Created by Jerry Fu on 1/9/2015.
 */
var GLOBAL = GLOBAL || {};
window.onload = function() {


    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameContainer', { preload: preload, create: create, update: update});
    GLOBAL.game = game;

    function preload() {
        game.load.atlasJSONHash('sheep', 'assets/images/sheepAnim.png', 'assets/images/sheepAnim.json');

        game.plugins.add(new Phaser.Plugin.Isometric(game));
    }

    function create()
    {
        game.stage.disableVisibilityChange = true;

        for (var i=0; i < 50; i++)
        {
            var creature = new GlassLab.Creature(game, "sheep");
            game.world.add(creature.sprite);
            creature.sprite.input.enableDrag(true);
            creature.sprite.x = Math.random() * game.world.width;
            creature.sprite.y = Math.random() * game.world.height;
            creature.sprite.scale.x = creature.sprite.scale.y = .25;
            if (i%2)
            {
                creature.sprite.scale.x *= -1;
            }

            creature.sprite.events.onDragStart.add(onDragStart, this);
            creature.sprite.events.onDragStop.add(onDragStop, this);
        }

        //game.add.text(250, 250, "HTML5 Prototype 1", { fill:"#fff" }).name = "Text";

        game.input.onDown.add(globalDown, this);
    }

    function onDragStart(sprite, pointer)
    {
        GLOBAL.dragTarget = sprite;
    }
    function onDragStop(sprite, pointer)
    {
        GLOBAL.dragTarget = null;
    }

    function globalDown(pointer, DOMevent)
    {
        if (!pointer.targetObject)
        {
            for (var i=0; i < 10; i++)
            {
                var creature = new GlassLab.Creature(game, "sheep");
                game.world.add(creature.sprite);
                creature.sprite.input.enableDrag(true);
                creature.sprite.x = Math.random() * game.world.width;
                creature.sprite.y = Math.random() * game.world.height;
                creature.sprite.scale.x = creature.sprite.scale.y = .25;
                if (i%2)
                {
                    creature.sprite.scale.x *= -1;
                }

                creature.sprite.events.onDragStart.add(onDragStart, this);
                creature.sprite.events.onDragStop.add(onDragStop, this);
            }
        }
    }

    function update(game)
    {
        GlassLab.SignalManager.update.dispatch(game.time.elapsedMS);

        game.world.sort('y');

        if (GLOBAL.dragTarget)
        {
            game.world.bringToTop(GLOBAL.dragTarget);
        }
    }
};