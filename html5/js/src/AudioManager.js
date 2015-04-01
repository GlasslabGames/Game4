/**
 * Created by Rose Abernathy on 3/5/2015.
 */

var GlassLab = GlassLab || {};

/**
 * AudioManager
 */

GlassLab.AudioManager = function(game)
{
    this.game = game;

    this.backgroundMusic = game.add.audio('backgroundMusic');
    this.bonusMusic = game.add.audio('bonusMusic');
    this.currentMusic = this.backgroundMusic;

    this.sounds = {};
    this.maxPoolSize = 3; // i.e. no more than 3 copies of each sound can play at the same time
};

GlassLab.AudioManager.SOUND_GROUPS = {

};

GlassLab.AudioManager.prototype.toggleMusic = function(on)
{
    if (typeof on == 'undefined') on = !this.musicOn;
    this.musicOn = on;
    if (this.musicOn) {
        this.currentMusic.play('',0,1,true);
    } else {
        this.currentMusic.stop();
    }

    GlassLab.Util.SetCookieData("musicOn", this.musicOn);
};

// switches the current music we want to play in this area (even if the music is currently turned off)
GlassLab.AudioManager.prototype.switchMusic = function(key) {
    var nextMusic = (key.play)? key : (this[key] || this[key+"Music"]); // if we passed in an actual Sound, use that. Else use it as a key.
    if (this.currentMusic != nextMusic && this.currentMusic.isPlaying) {
        this.currentMusic.stop();
        nextMusic.play('', 0, 1, true);
    }
    this.prevMusic = this.currentMusic;
    this.currentMusic = nextMusic;
};

// Revert music back to whatever it was last before the current music
GlassLab.AudioManager.prototype.revertMusic = function() {
  if (this.prevMusic) this.switchMusic(this.prevMusic);
};

GlassLab.AudioManager.prototype.toggleSoundEffects = function(on)
{
    if (typeof on == 'undefined') on = !this.soundEffectsOn;
    this.soundEffectsOn = on;
    this.soundEffectsVolume = (on)? 1 : 0;

    // if any sound effects are currently playing, set the correct volume
    for (var key in this.sounds) {
        for (var i = 0; i < this.sounds[key].length; i++) {
            if (this.sounds[key][i].isPlaying) {
                this.sounds[key][i].volume = this.soundEffectsVolume;
            }
        }
    }

    GlassLab.Util.SetCookieData("sfxOn", this.soundEffectsOn);
};

// plays a sound from our pool
GlassLab.AudioManager.prototype.playSound = function(key, randomStart, loop)
{
    //if (key.indexOf("Sound") == -1) key += "Sound"; // e.g. you can use either "eating" or "eatingSound" as the key

    var sound;

    if (!this.sounds[key]) this.sounds[key] = [];
    for (var i = 0; i < this.sounds[key].length; i++) {
        if (!this.sounds[key][i].isPlaying) { // grab the first sound from the pool that isn't playing yet
            sound = this.sounds[key][i];
            break;
        }
    }
    if (!sound) { // none available in the pool, so add a new one
        if (this.sounds[key].length >= this.maxPoolSize) return null; // unless we've already hit our max pool size - then don't play anything

        sound = this.game.add.audio(key);
        this.sounds[key].push(sound);
    }
    this._playSound(sound, key, randomStart, loop);
    return sound;
};

GlassLab.AudioManager.prototype._playSound = function(sound, key, randomStart, loop) {
    var volume = (key.indexOf("vomit") > -1)? this.soundEffectsVolume / 2 : this.soundEffectsVolume; // hacks because the vomit sound is too gross

    var start = 0;
    if (randomStart) {
        var duration = sound.duration;
        // sound.duration doesn't work with webaudio, so also check for the data about the asset instead
        if (!sound.duration && this.game.cache.getSound(key) && this.game.cache.getSound(key).data) {
            duration = this.game.cache.getSound(key).data.duration;
        }
        // but, it's possible that both will fail if we try to start the sound immediately before the asset data is decoded :(
        start = Math.random() * duration;
    }

    sound.play('',start,volume,loop);
    return sound;
};