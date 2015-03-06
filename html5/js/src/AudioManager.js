/**
 * Created by Rose Abernathy on 3/5/2015.
 */

var GlassLab = GlassLab || {};

/**
 * MailManager
 */

GlassLab.AudioManager = function(game)
{
    this.game = game;

    this.music = game.add.audio('music1');

    this.soundEffects = {};
    // We can treat all the sound effects the same
    var soundEffects = ["eating", "footsteps", "vomit"];
    for (var i = 0; i < soundEffects.length; i++) {
        this.soundEffects[soundEffects[i]] = game.add.audio(soundEffects[i]+"Sound");
    }
};

GlassLab.AudioManager.prototype.toggleMusic = function(on)
{
    if (typeof on == 'undefined') on = !this.musicOn;
    this.musicOn = on;
    if (this.musicOn) {
        this.music.play('',0,1,true);
    } else {
        this.music.stop();
    }
};

GlassLab.AudioManager.prototype.playSound = function(key, randomStart, loop)
{
    var volume = (key == "vomit")? 0.5 : 1; // hacks because the vomit sound is too gross

    var start = 0;
    if (randomStart) {
        var duration = 2.76; // the reason this is hardcoded is that sound.duration doesn't work with webaudio. This is for footsteps but add more lenghts later.
        // There's also game.cache.getSound(key) but the data was decoded yet ? http://www.html5gamedevs.com/topic/6209-sound-element-duration-is-0/
        start = Math.random() * duration;
    }

    var sound = this.game.add.audio(key+"Sound");
    sound.play('',start,volume,loop);
    return sound;
};